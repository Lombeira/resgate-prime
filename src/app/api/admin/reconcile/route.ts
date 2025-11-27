import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProviderClient } from '@/lib/providerClient';
import { createLogger } from '@/lib/logger';
import { getPendingWithdrawals } from '@/services/withdrawalService';
import { enqueueJob } from '@/lib/queue';

/**
 * POST /api/admin/reconcile
 *
 * Força reconciliação de ordens e withdrawals pendentes
 * Endpoint administrativo protegido
 */

export async function POST(req: NextRequest) {
  const log = createLogger({ endpoint: '/api/admin/reconcile' });

  try {
    // Autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !validateAuth(authHeader)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    log.info('🔄 Iniciando reconciliação manual');

    // Buscar ordens pendentes
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PLACED', 'PARTIAL'] },
      },
      select: { id: true },
    });

    // Buscar withdrawals pendentes
    const pendingWithdrawalIds = await getPendingWithdrawals();

    log.info('📊 Itens pendentes encontrados', {
      orders: pendingOrders.length,
      withdrawals: pendingWithdrawalIds.length,
    });

    // Enfileirar verificações
    const jobs = [];

    for (const order of pendingOrders) {
      jobs.push(enqueueJob('checkOrderStatus', { orderId: order.id }));
    }

    for (const withdrawalId of pendingWithdrawalIds) {
      jobs.push(enqueueJob('checkWithdrawalStatus', { withdrawalId }));
    }

    await Promise.all(jobs);

    log.info('✅ Reconciliação enfileirada', {
      totalJobs: jobs.length,
    });

    return NextResponse.json({
      success: true,
      reconciled: {
        orders: pendingOrders.length,
        withdrawals: pendingWithdrawalIds.length,
      },
    });
  } catch (error) {
    log.error('❌ Erro na reconciliação', error as Error);
    return NextResponse.json(
      { error: 'Erro na reconciliação' },
      { status: 500 }
    );
  }
}

function validateAuth(authHeader: string): boolean {
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.INTERNAL_API_SECRET;
}
