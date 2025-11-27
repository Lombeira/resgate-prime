import { Redis } from '@upstash/redis';
import { getEnv } from './env';

/**
 * Rate limiting usando Upstash Redis
 * Sliding window algorithm
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

let redis: Redis | null = null;

function getRedis(): Redis | null {
  const env = getEnv();

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

/**
 * Verifica e aplica rate limit
 */
export async function checkRateLimit(
  identifier: string,
  options?: {
    maxRequests?: number;
    windowMs?: number;
  }
): Promise<RateLimitResult> {
  const redisClient = getRedis();
  const env = getEnv();

  const maxRequests = options?.maxRequests || env.RATE_LIMIT_MAX_REQUESTS;
  const windowMs = options?.windowMs || env.RATE_LIMIT_WINDOW_MS;

  // Se Redis não disponível, permite a requisição
  if (!redisClient) {
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Date.now() + windowMs,
    };
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Remove entradas antigas da janela
    await redisClient.zremrangebyscore(key, 0, windowStart);

    // Conta requisições na janela atual
    const count = await redisClient.zcard(key);

    if (count >= maxRequests) {
      const oldestTimestamp = await redisClient.zrange(key, 0, 0, {
        withScores: true,
      });
      const reset = oldestTimestamp[1]
        ? Number(oldestTimestamp[1]) + windowMs
        : now + windowMs;

      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset,
      };
    }

    // Adiciona nova requisição
    await redisClient.zadd(key, {
      score: now,
      member: `${now}-${Math.random()}`,
    });
    await redisClient.expire(key, Math.ceil(windowMs / 1000));

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - count - 1,
      reset: now + windowMs,
    };
  } catch (error) {
    console.error('❌ Erro no rate limit:', error);
    // Em caso de erro, permite a requisição
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: now + windowMs,
    };
  }
}

/**
 * Middleware para Next.js API Routes
 */
export function createRateLimitMiddleware(options?: {
  maxRequests?: number;
  windowMs?: number;
  keyGenerator?: (req: Request) => string;
}) {
  return async (req: Request): Promise<Response | null> => {
    const identifier = options?.keyGenerator
      ? options.keyGenerator(req)
      : extractIdentifier(req);

    const result = await checkRateLimit(identifier, options);

    // Adicionar headers de rate limit
    const headers = new Headers({
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit excedido',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...Object.fromEntries(headers),
            'Content-Type': 'application/json',
            'Retry-After': String(
              Math.ceil((result.reset - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    return null; // Continue
  };
}

/**
 * Extrai identificador da requisição (IP ou API key)
 */
function extractIdentifier(req: Request): string {
  const headers = req.headers;

  // Priorizar API key se presente
  const apiKey = headers.get('x-api-key');
  if (apiKey) return `key:${apiKey}`;

  // Usar IP
  const ip =
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('cf-connecting-ip') ||
    'unknown';

  return `ip:${ip}`;
}
