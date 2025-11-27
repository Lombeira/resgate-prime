import { getEnv } from './env';
import { logger } from './logger';

/**
 * Sistema de alertas para operações críticas
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';

interface Alert {
  title: string;
  message: string;
  severity: AlertSeverity;
  context?: Record<string, any>;
}

/**
 * Envia alerta via múltiplos canais
 */
export async function sendAlert(alert: Alert): Promise<void> {
  const env = getEnv();

  logger.warn(`🚨 ALERTA [${alert.severity}]: ${alert.title}`, {
    message: alert.message,
    ...alert.context,
  });

  // Slack
  if (env.SLACK_WEBHOOK_URL) {
    await sendSlackAlert(env.SLACK_WEBHOOK_URL, alert);
  }

  // Email (implementar com SendGrid/Resend)
  if (env.ALERT_EMAIL && alert.severity === 'critical') {
    await sendEmailAlert(env.ALERT_EMAIL, alert);
  }

  // Sentry para erros críticos
  if (env.SENTRY_DSN && alert.severity === 'critical') {
    // TODO: Integrar Sentry SDK
    console.log('📤 Enviaria para Sentry:', alert);
  }
}

/**
 * Envia notificação para Slack
 */
async function sendSlackAlert(webhookUrl: string, alert: Alert): Promise<void> {
  try {
    const emoji = {
      info: ':information_source:',
      warning: ':warning:',
      critical: ':rotating_light:',
    }[alert.severity];

    const color = {
      info: '#36a64f',
      warning: '#ff9900',
      critical: '#ff0000',
    }[alert.severity];

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: `${emoji} ${alert.title}`,
            text: alert.message,
            fields: alert.context
              ? Object.entries(alert.context).map(([key, value]) => ({
                  title: key,
                  value: String(value),
                  short: true,
                }))
              : undefined,
            footer: 'Resgate Prime',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });

    logger.debug('✅ Alerta enviado para Slack');
  } catch (error) {
    logger.error('❌ Erro ao enviar alerta para Slack', error as Error);
  }
}

/**
 * Envia email de alerta
 */
async function sendEmailAlert(email: string, alert: Alert): Promise<void> {
  // TODO: Implementar com SendGrid/Resend/Nodemailer
  logger.info(`📧 Email de alerta seria enviado para ${email}`, alert);
}

/**
 * Alertas pré-definidos
 */

export async function alertWithdrawalFailed(
  withdrawalId: string,
  error: string,
  attempts: number
): Promise<void> {
  await sendAlert({
    title: 'Falha em Withdrawal',
    message: `Withdrawal ${withdrawalId} falhou após ${attempts} tentativas`,
    severity: attempts >= 3 ? 'critical' : 'warning',
    context: { withdrawalId, error, attempts },
  });
}

export async function alertOrderStuck(
  orderId: string,
  minutes: number
): Promise<void> {
  await sendAlert({
    title: 'Ordem Travada',
    message: `Ordem ${orderId} está pendente há ${minutes} minutos`,
    severity: minutes > 30 ? 'critical' : 'warning',
    context: { orderId, minutes },
  });
}

export async function alertHighDiscrepancy(
  donationId: string,
  expectedUsdt: string,
  receivedUsdt: string,
  discrepancy: string
): Promise<void> {
  await sendAlert({
    title: 'Discrepância de Conversão',
    message: `Diferença suspeita entre BRL e USDT na doação ${donationId}`,
    severity: 'critical',
    context: { donationId, expectedUsdt, receivedUsdt, discrepancy },
  });
}

export async function alertLowBalance(
  asset: string,
  balance: string
): Promise<void> {
  await sendAlert({
    title: 'Saldo Baixo',
    message: `Saldo de ${asset} está baixo: ${balance}`,
    severity: 'warning',
    context: { asset, balance },
  });
}
