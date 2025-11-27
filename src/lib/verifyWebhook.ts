import crypto from 'crypto';
import { getEnv } from './env';

/**
 * Verifica assinatura HMAC SHA-256 do webhook
 * Previne replay attacks verificando timestamp
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp?: string
): boolean {
  try {
    const env = getEnv();

    // Verificar timestamp para prevenir replay attacks (5 minutos de janela)
    if (timestamp) {
      const webhookTime = new Date(timestamp).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (Math.abs(now - webhookTime) > fiveMinutes) {
        console.warn('⚠️ Webhook timestamp fora da janela permitida');
        return false;
      }
    }

    // Calcular HMAC do payload
    const hmac = crypto.createHmac('sha256', env.WEBHOOK_SECRET);
    const expectedSignature = hmac.update(payload).digest('hex');

    // Comparação segura contra timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('❌ Erro ao verificar assinatura do webhook:', error);
    return false;
  }
}

/**
 * Gera assinatura para testes
 */
export function generateWebhookSignature(payload: string): string {
  const env = getEnv();
  const hmac = crypto.createHmac('sha256', env.WEBHOOK_SECRET);
  return hmac.update(payload).digest('hex');
}

/**
 * Valida IP do webhook (whitelist)
 */
export function validateWebhookIP(ip: string): boolean {
  // Lista de IPs permitidos do provedor (exemplo)
  const allowedIPs = [
    '200.234.195.0/24', // MercadoBitcoin range exemplo
    // Adicionar ranges reais do provedor
  ];

  // Se não houver whitelist configurada, permite qualquer IP
  if (allowedIPs.length === 0) return true;

  // Validação simplificada - em produção usar biblioteca como 'ip-range-check'
  return allowedIPs.some((range) => {
    const baseIP = range.split('/')[0];
    return ip.startsWith(baseIP.substring(0, baseIP.lastIndexOf('.')));
  });
}

/**
 * Extrai IP real considerando proxies (Vercel/Cloudflare)
 */
export function extractRealIP(headers: Headers): string {
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
