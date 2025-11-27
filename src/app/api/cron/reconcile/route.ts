import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { monitorStuckOrders } from '@/services/orderService';
import { checkOrderStatus } from '@/services/orderService';
import { checkWithdrawalStatus } from '@/services/withdrawalService';

/**
 * GET /api/cron/reconcile
 * 
 * Cron job diário para reconciliação (plano Hobby Vercel)
 * Executa 1x por dia às 03:00 UTC (00:00 BRT): 0 3 * * *
 * 
 * Verifica e reconcilia:
 * - Ordens pendentes
 * - Withdrawals não confirmados
 * - Doações travadas
 */

export async function GET(req: NextRequest) {
  const log = createLogger({ endpoint: '/api/cron/reconcile' });

  try {
    // Verificar autenticação do cron (Vercel envia header especial)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    log.info('🔄 Reconciliação periódica iniciada');

    let reconciled = 0;
    const errors: string[] = [];

    // 1. Verificar ordens pendentes
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PLACED', 'PARTIAL'] },
      },
      take: 50, // Limitar para não estourar timeout
    });

    log.info(`📊 Verificando ${pendingOrders.length} ordens pendentes`);

    for (const order of pendingOrders) {
      try {
        await checkOrderStatus(order.id);
        reconciled++;
      } catch (error) {
        errors.push(`Order ${order.id}: ${(error as Error).message}`);
      }
    }

    // 2. Verificar withdrawals pendentes
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING', 'SENT'] },
      },
      take: 50,
    });

    log.info(`💸 Verificando ${pendingWithdrawals.length} withdrawals pendentes`);

    for (const withdrawal of pendingWithdrawals) {
      try {
        await checkWithdrawalStatus(withdrawal.id);
        reconciled++;
      } catch (error) {
        errors.push(`Withdrawal ${withdrawal.id}: ${(error as Error).message}`);
      }
    }

    // 3. Monitorar ordens travadas
    await monitorStuckOrders();

    // 4. Limpar webhooks antigos (> 30 dias)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.webhookEvent.deleteMany({
      where: {
        status: 'PROCESSED',
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    log.info(`🗑️ Limpou ${deleted.count} webhooks antigos`);

    log.info('✅ Reconciliação concluída', {
      reconciled,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      reconciled,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('❌ Erro na reconciliação', error as Error);
    return NextResponse.json(
      { error: 'Erro na reconciliação' },
      { status: 500 }
    );
  }
}

