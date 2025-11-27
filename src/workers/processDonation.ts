import { Decimal } from 'decimal.js';
import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { createOrder } from '@/services/orderService';
import { createWithdrawal } from '@/services/withdrawalService';
import { enqueueJob } from '@/lib/queue';

/**
 * Worker que processa uma doação:
 * 1. Cria ordem BRL → USDT
 * 2. Aguarda fill da ordem
 * 3. Cria withdrawal de USDT
 */

export interface ProcessDonationData {
  donationId: string;
  amountBrl: string;
}

export async function processDonation(
  data: ProcessDonationData
): Promise<void> {
  const log = createLogger({
    worker: 'processDonation',
    donationId: data.donationId,
  });

  try {
    log.info('🚀 Iniciando processamento de doação');

    // Buscar doação
    const donation = await prisma.donation.findUnique({
      where: { id: data.donationId },
      include: { order: true },
    });

    if (!donation) {
      throw new Error(`Doação ${data.donationId} não encontrada`);
    }

    // Verificar se já foi processada
    if (donation.status === 'PROCESSED') {
      log.info('ℹ️ Doação já foi processada');
      return;
    }

    // Criar ordem se ainda não existe
    let order = donation.order;

    if (!order) {
      log.info('📊 Criando ordem de conversão');

      const orderResult = await createOrder({
        donationId: donation.id,
        amountBrl: new Decimal(data.amountBrl),
      });

      order = await prisma.order.findUnique({
        where: { id: orderResult.orderId },
      });

      if (!order) {
        throw new Error('Falha ao criar ordem');
      }
    }

    // Verificar status da ordem
    if (order.status === 'PLACED' || order.status === 'PARTIAL') {
      log.info('⏳ Ordem ainda não foi preenchida, enfileirando verificação');

      // Enfileirar job para verificar status depois
      await enqueueJob(
        'checkOrderStatus',
        { orderId: order.id },
        { delay: 30000 }
      ); // 30s
      return;
    }

    if (order.status === 'FAILED' || order.status === 'CANCELLED') {
      log.error('❌ Ordem falhou ou foi cancelada', { status: order.status });

      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: 'FAILED' },
      });

      return;
    }

    // Ordem foi preenchida - criar withdrawal
    if (order.status === 'FILLED') {
      log.info('✅ Ordem preenchida, criando withdrawal');

      if (!order.filledUsdt) {
        throw new Error('Ordem FILLED mas sem filledUsdt');
      }

      // Verificar se já existe withdrawal
      const existingWithdrawal = await prisma.withdrawal.findUnique({
        where: { orderId: order.id },
      });

      if (!existingWithdrawal) {
        await createWithdrawal({
          orderId: order.id,
          amount: new Decimal(order.filledUsdt.toString()),
        });
      }

      // Enfileirar job para verificar withdrawal
      const withdrawal = await prisma.withdrawal.findUnique({
        where: { orderId: order.id },
      });

      if (withdrawal && withdrawal.status !== 'CONFIRMED') {
        await enqueueJob(
          'checkWithdrawalStatus',
          { withdrawalId: withdrawal.id },
          { delay: 60000 } // 1 min
        );
      }

      log.info('✅ Doação processada com sucesso');
    }
  } catch (error) {
    log.error('❌ Erro ao processar doação', error as Error);

    // Marcar doação como falha se erro crítico
    await prisma.donation
      .update({
        where: { id: data.donationId },
        data: { status: 'FAILED' },
      })
      .catch(() => {});

    throw error;
  }
}
