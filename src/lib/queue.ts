import { Redis } from '@upstash/redis';
import { getEnv } from './env';

/**
 * Sistema de fila simples usando Upstash Redis
 * Para produção com alto volume, considerar BullMQ ou AWS SQS
 */

interface QueueJob<T = any> {
  id: string;
  type: string;
  data: T;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledFor?: string;
}

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  const env = getEnv();

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️ Redis não configurado. Usando processamento síncrono.');
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisClient;
}

/**
 * Adiciona job à fila
 */
export async function enqueueJob<T>(
  type: string,
  data: T,
  options: {
    delay?: number; // ms
    maxAttempts?: number;
  } = {}
): Promise<string> {
  const redis = getRedisClient();

  const job: QueueJob<T> = {
    id: crypto.randomUUID(),
    type,
    data,
    attempts: 0,
    maxAttempts: options.maxAttempts || 3,
    createdAt: new Date().toISOString(),
    scheduledFor: options.delay
      ? new Date(Date.now() + options.delay).toISOString()
      : undefined,
  };

  if (!redis) {
    // Fallback: processar imediatamente se Redis não disponível
    console.warn('⚠️ Processando job síncrono:', type);
    await processJobImmediately(job);
    return job.id;
  }

  // Adicionar à fila Redis
  const queueKey = `queue:${type}`;
  await redis.lpush(queueKey, JSON.stringify(job));

  console.log(`✅ Job enfileirado: ${type} (${job.id})`);
  return job.id;
}

/**
 * Processa próximo job da fila
 */
export async function dequeueJob(type: string): Promise<QueueJob | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const queueKey = `queue:${type}`;
  const jobJson = await redis.rpop(queueKey);

  if (!jobJson) return null;

  const job: QueueJob = JSON.parse(jobJson as string);

  // Verificar se está agendado para o futuro
  if (job.scheduledFor && new Date(job.scheduledFor) > new Date()) {
    // Retornar à fila
    await redis.lpush(queueKey, JSON.stringify(job));
    return null;
  }

  return job;
}

/**
 * Marca job como falhado e reenfila se houver tentativas restantes
 */
export async function requeueFailedJob(
  job: QueueJob,
  error: Error
): Promise<void> {
  const redis = getRedisClient();

  job.attempts += 1;

  if (job.attempts >= job.maxAttempts) {
    console.error(
      `❌ Job ${job.id} falhou após ${job.attempts} tentativas:`,
      error
    );

    // Mover para DLQ (Dead Letter Queue)
    if (redis) {
      await redis.lpush(
        `dlq:${job.type}`,
        JSON.stringify({
          ...job,
          error: error.message,
          failedAt: new Date().toISOString(),
        })
      );
    }

    return;
  }

  // Retry com backoff exponencial
  const delayMs = Math.min(1000 * Math.pow(2, job.attempts), 60000); // max 1 min
  job.scheduledFor = new Date(Date.now() + delayMs).toISOString();

  console.warn(
    `⚠️ Reenfileirando job ${job.id} (tentativa ${job.attempts}/${job.maxAttempts})`
  );

  if (redis) {
    await redis.lpush(`queue:${job.type}`, JSON.stringify(job));
  }
}

/**
 * Processamento imediato (fallback sem Redis)
 */
async function processJobImmediately(job: QueueJob): Promise<void> {
  try {
    // Importar e executar o handler apropriado
    const { processJob } = await import('@/workers/jobProcessor');
    await processJob(job);
  } catch (error) {
    console.error('❌ Erro ao processar job síncrono:', error);
    throw error;
  }
}

/**
 * Worker que processa jobs continuamente
 * Chamar via Vercel Cron ou processo separado
 */
export async function processQueueWorker(
  type: string,
  limit = 10
): Promise<number> {
  let processed = 0;

  for (let i = 0; i < limit; i++) {
    const job = await dequeueJob(type);
    if (!job) break;

    try {
      const { processJob } = await import('@/workers/jobProcessor');
      await processJob(job);
      processed++;
    } catch (error) {
      await requeueFailedJob(job, error as Error);
    }
  }

  return processed;
}
