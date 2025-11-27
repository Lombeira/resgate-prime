import { z } from 'zod';

// Validação e tipagem das variáveis de ambiente
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Provider
  PROVIDER_NAME: z.enum(['mercado_bitcoin', 'parfin']),
  PROVIDER_API_URL: z.string().url(),
  PROVIDER_API_KEY: z.string().min(1),
  PROVIDER_API_SECRET: z.string().min(1),

  // Webhook
  WEBHOOK_SECRET: z.string().min(32),

  // Wallet
  USDT_WALLET_ADDRESS: z.string().min(20),
  USDT_NETWORK: z.enum(['TRC20', 'ERC20', 'POLYGON']),

  // Internal
  INTERNAL_API_SECRET: z.string().min(32),

  // Queue (Upstash Redis)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Observability
  SENTRY_DSN: z.string().url().optional(),

  // Alerting
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  ALERT_EMAIL: z.string().email().optional(),

  // Feature Flags
  ENABLE_AUTO_WITHDRAW: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  MIN_DONATION_BRL: z
    .string()
    .transform((v) => Number(v))
    .default('10'),
  MAX_DONATION_BRL: z
    .string()
    .transform((v) => Number(v))
    .default('50000'),

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform((v) => Number(v))
    .default('100'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((v) => Number(v))
    .default('60000'),

  // Node env
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type Env = z.infer<typeof envSchema>;

// Lazy loading e cache da validação
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  try {
    cachedEnv = envSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Variáveis de ambiente inválidas:');
      console.error(error.errors);
      throw new Error(
        'Configuração inválida. Verifique as variáveis de ambiente.'
      );
    }
    throw error;
  }
}

// Helper para validar no build time
export function validateEnv() {
  getEnv();
  console.log('✅ Variáveis de ambiente validadas com sucesso');
}
