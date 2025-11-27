import { NextRequest, NextResponse } from 'next/server';
import { processQueueWorker } from '@/lib/queue';
import { createLogger } from '@/lib/logger';
import { monitorStuckOrders } from '@/services/orderService';

/**
 * GET /api/cron/worker
 *
 * Worker executado via Vercel Cron
 * Processa jobs enfileirados e monitora sistema
 *
 * Configurar em vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/worker",
 *       "schedule": "* * * * *"
 *     }
 *   ]
 * }
 */

export async function GET(req: NextRequest) {
  const log = createLogger({ endpoint: '/api/cron/worker' });

  try {
    // Verificar autenticação do cron (Vercel envia header especial)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    log.info('⚙️ Worker iniciado');

    // Processar filas
    const results = await Promise.allSettled([
      processQueueWorker('processDonation', 10),
      processQueueWorker('checkOrderStatus', 10),
      processQueueWorker('checkWithdrawalStatus', 10),
    ]);

    const processed = results
      .filter((r) => r.status === 'fulfilled')
      .reduce((sum, r) => sum + (r as any).value, 0);

    log.info('✅ Filas processadas', { processed });

    // Monitorar ordens travadas
    await monitorStuckOrders();

    return NextResponse.json({
      success: true,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('❌ Erro no worker', error as Error);
    return NextResponse.json({ error: 'Erro no worker' }, { status: 500 });
  }
}
