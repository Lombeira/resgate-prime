import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { checkOrderStatus } from '@/services/orderService';
import { enqueueJob } from '@/lib/queue';
import { Decimal } from 'decimal.js';

/**
 * Worker que verifica status de uma ordem
 */

export interface ProcessOrderCheckData {
  orderId: string;
}

export async function processOrderCheck(
  data: ProcessOrderCheckData
): Promise<void> {
  const log = createLogger({
    worker: 'processOrderCheck',
    orderId: data.orderId,
  });

  try {
    log.info('🔍 Verificando status da ordem');

    const result = await checkOrderStatus(data.orderId);

    log.info('✅ Status verificado', { status: result.status });

    // Se ainda está pendente, reenfileirar
    if (result.status === 'PLACED' || result.status === 'PARTIAL') {
      log.info('⏳ Ordem ainda pendente, verificando novamente em 30s');
      await enqueueJob('checkOrderStatus', data, { delay: 30000 });
      return;
    }

    // Se foi preenchida, enfileirar processamento da doação
    if (result.status === 'FILLED') {
      log.info('✅ Ordem preenchida, enfileirando processamento');

      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
      });

      if (order) {
        await enqueueJob('processDonation', {
          donationId: order.donationId,
          amountBrl: order.amountBrl.toString(),
        });
      }
    }
  } catch (error) {
    log.error('❌ Erro ao verificar ordem', error as Error);
    throw error;
  }
}
