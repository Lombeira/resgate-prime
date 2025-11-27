import { Decimal } from 'decimal.js';
import { prisma } from '@/lib/db';
import { getProviderClient } from '@/lib/providerClient';
import { logger, createLogger } from '@/lib/logger';
import { alertOrderStuck } from '@/lib/alerts';
import { OrderStatus } from '@prisma/client';

/**
 * Service para gerenciar ordens de conversão BRL → USDT
 */

export interface CreateOrderParams {
  donationId: string;
  amountBrl: Decimal;
}

export interface OrderResult {
  orderId: string;
  status: OrderStatus;
  filledUsdt?: Decimal;
}

/**
 * Cria ordem de compra de USDT com BRL
 */
export async function createOrder(
  params: CreateOrderParams
): Promise<OrderResult> {
  const log = createLogger({
    service: 'orderService',
    donationId: params.donationId,
  });

  try {
    log.info('🔄 Criando ordem de conversão', {
      amountBrl: params.amountBrl.toString(),
    });

    // Verificar se já existe ordem para esta doação
    const existing = await prisma.order.findUnique({
      where: { donationId: params.donationId },
    });

    if (existing) {
      log.warn('⚠️ Ordem já existe para esta doação', {
        orderId: existing.id,
        status: existing.status,
      });
      return {
        orderId: existing.id,
        status: existing.status,
        filledUsdt: existing.filledUsdt
          ? new Decimal(existing.filledUsdt.toString())
          : undefined,
      };
    }

    // Criar ordem no provedor
    const providerClient = getProviderClient();
    const providerOrder = await providerClient.createOrder({
      pair: 'USDT-BRL',
      side: 'BUY',
      type: 'MARKET',
      amountBrl: params.amountBrl,
    });

    log.info('✅ Ordem criada no provedor', {
      providerOrderId: providerOrder.id,
      status: providerOrder.status,
    });

    // Persistir no banco
    const order = await prisma.order.create({
      data: {
        donationId: params.donationId,
        providerOrderId: providerOrder.id,
        pair: 'USDT-BRL',
        side: 'BUY',
        amountBrl: params.amountBrl,
        expectedUsdt: providerOrder.executedAmount,
        filledUsdt: providerOrder.executedAmount,
        executedPrice: providerOrder.executedPrice,
        status: mapProviderStatus(providerOrder.status),
        placedAt: providerOrder.createdAt,
      },
    });

    // Atualizar doação
    await prisma.donation.update({
      where: { id: params.donationId },
      data: { status: 'PROCESSING' },
    });

    log.info('✅ Ordem persistida no banco', { orderId: order.id });

    return {
      orderId: order.id,
      status: order.status,
      filledUsdt: order.filledUsdt
        ? new Decimal(order.filledUsdt.toString())
        : undefined,
    };
  } catch (error) {
    log.error('❌ Erro ao criar ordem', error as Error);

    // Registrar falha no banco
    await prisma.order.create({
      data: {
        donationId: params.donationId,
        pair: 'USDT-BRL',
        side: 'BUY',
        amountBrl: params.amountBrl,
        status: 'FAILED',
        lastError: (error as Error).message,
        placedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Verifica status da ordem no provedor e atualiza banco
 */
export async function checkOrderStatus(orderId: string): Promise<OrderResult> {
  const log = createLogger({ service: 'orderService', orderId });

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Ordem ${orderId} não encontrada`);
    }

    if (!order.providerOrderId) {
      throw new Error(`Ordem ${orderId} não tem providerOrderId`);
    }

    // Consultar provedor
    const providerClient = getProviderClient();
    const providerOrder = await providerClient.getOrder(order.providerOrderId);

    log.info('✅ Status consultado no provedor', {
      status: providerOrder.status,
      filledAmount: providerOrder.executedAmount?.toString(),
    });

    // Atualizar banco
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: mapProviderStatus(providerOrder.status),
        filledUsdt: providerOrder.executedAmount,
        executedPrice: providerOrder.executedPrice,
        filledAt: providerOrder.status === 'FILLED' ? new Date() : undefined,
      },
    });

    return {
      orderId: updated.id,
      status: updated.status,
      filledUsdt: updated.filledUsdt
        ? new Decimal(updated.filledUsdt.toString())
        : undefined,
    };
  } catch (error) {
    log.error('❌ Erro ao verificar status da ordem', error as Error);

    // Incrementar retry count
    await prisma.order.update({
      where: { id: orderId },
      data: {
        retryCount: { increment: 1 },
        lastError: (error as Error).message,
      },
    });

    throw error;
  }
}

/**
 * Monitora ordens pendentes e alerta se travadas
 */
export async function monitorStuckOrders(): Promise<void> {
  const thresholdMinutes = 15;
  const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);

  const stuckOrders = await prisma.order.findMany({
    where: {
      status: { in: ['PLACED', 'PARTIAL'] },
      placedAt: { lt: threshold },
    },
    include: { donation: true },
  });

  for (const order of stuckOrders) {
    const minutes = Math.floor((Date.now() - order.placedAt.getTime()) / 60000);

    logger.warn('⚠️ Ordem travada detectada', {
      orderId: order.id,
      donationId: order.donationId,
      minutes,
    });

    await alertOrderStuck(order.id, minutes);

    // Tentar verificar status novamente
    try {
      await checkOrderStatus(order.id);
    } catch (error) {
      logger.error('❌ Erro ao verificar ordem travada', error as Error);
    }
  }
}

/**
 * Cancela ordem no provedor e marca como cancelada
 */
export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<void> {
  const log = createLogger({ service: 'orderService', orderId });

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Ordem ${orderId} não encontrada`);
    }

    if (order.status === 'FILLED') {
      throw new Error('Não é possível cancelar ordem já executada');
    }

    // TODO: Implementar cancelamento no provedor se suportado
    log.info('🚫 Cancelando ordem', { reason });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        lastError: reason,
      },
    });

    log.info('✅ Ordem cancelada');
  } catch (error) {
    log.error('❌ Erro ao cancelar ordem', error as Error);
    throw error;
  }
}

/**
 * Mapeia status do provedor para status interno
 */
function mapProviderStatus(status: string): OrderStatus {
  const mapping: Record<string, OrderStatus> = {
    PLACED: 'PLACED',
    FILLED: 'FILLED',
    PARTIAL: 'PARTIAL',
    CANCELLED: 'CANCELLED',
    FAILED: 'FAILED',
  };

  return mapping[status] || 'PLACED';
}

/**
 * Calcula slippage entre esperado e executado
 */
export function calculateSlippage(
  amountBrl: Decimal,
  expectedPrice: Decimal,
  executedUsdt: Decimal
): Decimal {
  const expectedUsdt = amountBrl.div(expectedPrice);
  const slippage = expectedUsdt
    .minus(executedUsdt)
    .div(expectedUsdt)
    .times(100);
  return slippage.abs();
}
