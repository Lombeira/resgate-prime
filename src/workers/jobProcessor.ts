import { createLogger } from '@/lib/logger';
import { processDonation } from './processDonation';
import { processOrderCheck } from './processOrderCheck';
import { processWithdrawalCheck } from './processWithdrawalCheck';

/**
 * Processador central de jobs
 * Router que direciona jobs para handlers específicos
 */

export interface QueueJob<T = any> {
  id: string;
  type: string;
  data: T;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledFor?: string;
}

/**
 * Processa job baseado no tipo
 */
export async function processJob(job: QueueJob): Promise<void> {
  const log = createLogger({
    worker: 'jobProcessor',
    jobId: job.id,
    jobType: job.type,
  });

  log.info('▶️ Processando job', {
    attempt: job.attempts + 1,
    maxAttempts: job.maxAttempts,
  });

  try {
    switch (job.type) {
      case 'processDonation':
        await processDonation(job.data);
        break;

      case 'checkOrderStatus':
        await processOrderCheck(job.data);
        break;

      case 'checkWithdrawalStatus':
        await processWithdrawalCheck(job.data);
        break;

      default:
        log.warn(`⚠️ Tipo de job desconhecido: ${job.type}`);
        break;
    }

    log.info('✅ Job processado com sucesso');
  } catch (error) {
    log.error('❌ Erro ao processar job', error as Error);
    throw error;
  }
}
