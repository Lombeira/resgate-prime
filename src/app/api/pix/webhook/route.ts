import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { verifyWebhookSignature, extractRealIP } from '@/lib/verifyWebhook';
import { enqueueJob } from '@/lib/queue';
import { createRateLimitMiddleware } from '@/lib/rateLimit';

/**
 * POST /api/pix/webhook
 *
 * Recebe webhooks do provedor (PIX recebido, ordem preenchida, etc)
 * Valida assinatura, persiste evento e enfileira processamento
 */

const webhookSchema = z.object({
  id: z.string(),
  type: z.enum(['pix.received', 'order.filled', 'withdrawal.confirmed']),
  timestamp: z.string(),
  data: z.object({
    transactionId: z.string().optional(),
    orderId: z.string().optional(),
    withdrawalId: z.string().optional(),
    amount: z.string().optional(),
    amountBrl: z.string().optional(),
    payerName: z.string().optional(),
    payerDocument: z.string().optional(),
    pixKey: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  const log = createLogger({ endpoint: '/api/pix/webhook' });

  try {
    // Rate limiting
    const rateLimitResponse = await createRateLimitMiddleware({
      maxRequests: 200,
      windowMs: 60000,
    })(req);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Extrair IP para logging
    const ip = extractRealIP(req.headers);
    log.info('📥 Webhook recebido', { ip });

    // Ler payload
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';

    // Validar assinatura
    if (!verifyWebhookSignature(rawBody, signature, timestamp)) {
      log.warn('⚠️ Assinatura inválida', { ip });
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(rawBody);
    const validatedData = webhookSchema.parse(payload);

    log.info('✅ Webhook validado', {
      eventId: validatedData.id,
      eventType: validatedData.type,
    });

    // Verificar idempotência
    const existing = await prisma.webhookEvent.findUnique({
      where: { providerId: validatedData.id },
    });

    if (existing) {
      log.info('ℹ️ Evento já processado (idempotente)', {
        eventId: validatedData.id,
      });
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Persistir evento
    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        providerId: validatedData.id,
        eventType: validatedData.type,
        rawPayload: payload,
        signature,
        status: 'RECEIVED',
      },
    });

    log.info('💾 Evento persistido', { webhookEventId: webhookEvent.id });

    // Processar baseado no tipo
    switch (validatedData.type) {
      case 'pix.received':
        await handlePixReceived(validatedData, webhookEvent.id);
        break;

      case 'order.filled':
        await handleOrderFilled(validatedData);
        break;

      case 'withdrawal.confirmed':
        await handleWithdrawalConfirmed(validatedData);
        break;
    }

    // Retornar 200 rapidamente
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn('⚠️ Payload inválido', { errors: error.errors });
      return NextResponse.json(
        { error: 'Payload inválido', details: error.errors },
        { status: 400 }
      );
    }

    log.error('❌ Erro ao processar webhook', error as Error);

    // Retornar 500 mas não expor detalhes
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook' },
      { status: 500 }
    );
  }
}

/**
 * Processa evento de PIX recebido
 */
async function handlePixReceived(
  data: z.infer<typeof webhookSchema>,
  webhookEventId: string
) {
  const log = createLogger({ handler: 'handlePixReceived' });

  try {
    const { transactionId, amountBrl, payerName, payerDocument, pixKey } =
      data.data;

    if (!transactionId || !amountBrl) {
      throw new Error(
        'Dados obrigatórios faltando: transactionId ou amountBrl'
      );
    }

    // Criar doação
    const donation = await prisma.donation.create({
      data: {
        providerId: transactionId,
        amountBrl,
        payerName: payerName || null,
        payerDocument: payerDocument || null,
        pixKey: pixKey || null,
        status: 'PENDING',
        receivedAt: new Date(data.timestamp),
        webhookEvents: {
          connect: { id: webhookEventId },
        },
      },
    });

    log.info('✅ Doação criada', {
      donationId: donation.id,
      amountBrl,
    });

    // Enfileirar processamento
    await enqueueJob('processDonation', {
      donationId: donation.id,
      amountBrl,
    });

    // Atualizar webhook como processado
    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
        donationId: donation.id,
      },
    });
  } catch (error) {
    log.error('❌ Erro ao processar PIX recebido', error as Error);

    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        status: 'FAILED',
        error: (error as Error).message,
      },
    });

    throw error;
  }
}

/**
 * Processa evento de ordem preenchida
 */
async function handleOrderFilled(data: z.infer<typeof webhookSchema>) {
  const log = createLogger({ handler: 'handleOrderFilled' });

  try {
    const { orderId } = data.data;

    if (!orderId) {
      throw new Error('orderId faltando no payload');
    }

    // Enfileirar verificação da ordem
    await enqueueJob('checkOrderStatus', { orderId });

    log.info('✅ Verificação de ordem enfileirada', { orderId });
  } catch (error) {
    log.error('❌ Erro ao processar order.filled', error as Error);
    throw error;
  }
}

/**
 * Processa evento de withdrawal confirmado
 */
async function handleWithdrawalConfirmed(data: z.infer<typeof webhookSchema>) {
  const log = createLogger({ handler: 'handleWithdrawalConfirmed' });

  try {
    const { withdrawalId } = data.data;

    if (!withdrawalId) {
      throw new Error('withdrawalId faltando no payload');
    }

    // Enfileirar verificação do withdrawal
    await enqueueJob('checkWithdrawalStatus', { withdrawalId });

    log.info('✅ Verificação de withdrawal enfileirada', { withdrawalId });
  } catch (error) {
    log.error('❌ Erro ao processar withdrawal.confirmed', error as Error);
    throw error;
  }
}
