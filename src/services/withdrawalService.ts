import { Decimal } from 'decimal.js';
import { prisma } from '@/lib/db';
import { getProviderClient } from '@/lib/providerClient';
import { getEnv } from '@/lib/env';
import { createLogger } from '@/lib/logger';
import { alertWithdrawalFailed } from '@/lib/alerts';
import { WithdrawalStatus } from '@prisma/client';

/**
 * Service para gerenciar retiradas de USDT para wallet própria
 */

export interface CreateWithdrawalParams {
  orderId: string;
  amount: Decimal;
}

export interface WithdrawalResult {
  withdrawalId: string;
  status: WithdrawalStatus;
  txHash?: string;
}

/**
 * Cria withdrawal de USDT para wallet configurada
 */
export async function createWithdrawal(
  params: CreateWithdrawalParams
): Promise<WithdrawalResult> {
  const log = createLogger({
    service: 'withdrawalService',
    orderId: params.orderId,
  });

  try {
    const env = getEnv();

    log.info('💸 Criando withdrawal', {
      amount: params.amount.toString(),
      address: env.USDT_WALLET_ADDRESS.substring(0, 10) + '...',
      network: env.USDT_NETWORK,
    });

    // Verificar se já existe withdrawal para esta ordem
    const existing = await prisma.withdrawal.findUnique({
      where: { orderId: params.orderId },
    });

    if (existing) {
      log.warn('⚠️ Withdrawal já existe para esta ordem', {
        withdrawalId: existing.id,
        status: existing.status,
      });
      return {
        withdrawalId: existing.id,
        status: existing.status,
        txHash: existing.txHash || undefined,
      };
    }

    // Validar endereço da wallet
    validateWalletAddress(env.USDT_WALLET_ADDRESS, env.USDT_NETWORK);

    // Verificar feature flag
    if (!env.ENABLE_AUTO_WITHDRAW) {
      log.warn(
        '⚠️ Auto-withdraw desabilitado. Criando withdrawal como PENDING'
      );

      const withdrawal = await prisma.withdrawal.create({
        data: {
          orderId: params.orderId,
          asset: 'USDT',
          network: env.USDT_NETWORK,
          amount: params.amount,
          address: env.USDT_WALLET_ADDRESS,
          status: 'PENDING',
        },
      });

      return {
        withdrawalId: withdrawal.id,
        status: withdrawal.status,
      };
    }

    // Criar withdrawal no provedor
    const providerClient = getProviderClient();
    const providerWithdrawal = await providerClient.createWithdraw({
      asset: 'USDT',
      network: env.USDT_NETWORK,
      amount: params.amount,
      address: env.USDT_WALLET_ADDRESS,
    });

    log.info('✅ Withdrawal criado no provedor', {
      providerWithdrawalId: providerWithdrawal.id,
      status: providerWithdrawal.status,
    });

    // Persistir no banco
    const withdrawal = await prisma.withdrawal.create({
      data: {
        orderId: params.orderId,
        providerWithdrawalId: providerWithdrawal.id,
        asset: 'USDT',
        network: env.USDT_NETWORK,
        amount: params.amount,
        address: env.USDT_WALLET_ADDRESS,
        status: mapProviderStatus(providerWithdrawal.status),
        fee: providerWithdrawal.fee,
        txHash: providerWithdrawal.txHash,
        sentAt: providerWithdrawal.status === 'SENT' ? new Date() : undefined,
      },
    });

    // Atualizar donation como PROCESSED se withdrawal foi enviado
    if (withdrawal.status === 'SENT' || withdrawal.status === 'CONFIRMED') {
      const order = await prisma.order.findUnique({
        where: { id: params.orderId },
        include: { donation: true },
      });

      if (order?.donation) {
        await prisma.donation.update({
          where: { id: order.donationId },
          data: { status: 'PROCESSED' },
        });
      }
    }

    log.info('✅ Withdrawal persistido no banco', {
      withdrawalId: withdrawal.id,
    });

    return {
      withdrawalId: withdrawal.id,
      status: withdrawal.status,
      txHash: withdrawal.txHash || undefined,
    };
  } catch (error) {
    log.error('❌ Erro ao criar withdrawal', error as Error);

    // Registrar falha no banco
    await prisma.withdrawal.create({
      data: {
        orderId: params.orderId,
        asset: 'USDT',
        network: getEnv().USDT_NETWORK,
        amount: params.amount,
        address: getEnv().USDT_WALLET_ADDRESS,
        status: 'FAILED',
        lastError: (error as Error).message,
      },
    });

    throw error;
  }
}

/**
 * Verifica status do withdrawal no provedor
 */
export async function checkWithdrawalStatus(
  withdrawalId: string
): Promise<WithdrawalResult> {
  const log = createLogger({ service: 'withdrawalService', withdrawalId });

  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { order: { include: { donation: true } } },
    });

    if (!withdrawal) {
      throw new Error(`Withdrawal ${withdrawalId} não encontrado`);
    }

    if (!withdrawal.providerWithdrawalId) {
      throw new Error(
        `Withdrawal ${withdrawalId} não tem providerWithdrawalId`
      );
    }

    // Consultar provedor
    const providerClient = getProviderClient();
    const providerWithdrawal = await providerClient.getWithdraw(
      withdrawal.providerWithdrawalId
    );

    log.info('✅ Status consultado no provedor', {
      status: providerWithdrawal.status,
      txHash: providerWithdrawal.txHash,
    });

    // Atualizar banco
    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: mapProviderStatus(providerWithdrawal.status),
        txHash: providerWithdrawal.txHash,
        fee: providerWithdrawal.fee,
        sentAt:
          providerWithdrawal.status === 'SENT' && !withdrawal.sentAt
            ? new Date()
            : withdrawal.sentAt,
        confirmedAt:
          providerWithdrawal.status === 'CONFIRMED'
            ? new Date()
            : withdrawal.confirmedAt,
      },
    });

    // Marcar donation como PROCESSED se confirmado
    if (
      updated.status === 'CONFIRMED' &&
      withdrawal.order.donation.status !== 'PROCESSED'
    ) {
      await prisma.donation.update({
        where: { id: withdrawal.order.donationId },
        data: { status: 'PROCESSED' },
      });
    }

    return {
      withdrawalId: updated.id,
      status: updated.status,
      txHash: updated.txHash || undefined,
    };
  } catch (error) {
    log.error('❌ Erro ao verificar status do withdrawal', error as Error);

    // Incrementar retry count
    const withdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        retryCount: { increment: 1 },
        lastError: (error as Error).message,
      },
    });

    // Alertar se atingiu limite de retries
    if (withdrawal.retryCount >= 3) {
      await alertWithdrawalFailed(
        withdrawalId,
        (error as Error).message,
        withdrawal.retryCount
      );
    }

    throw error;
  }
}

/**
 * Retry manual de withdrawal falhado
 */
export async function retryWithdrawal(
  withdrawalId: string
): Promise<WithdrawalResult> {
  const log = createLogger({ service: 'withdrawalService', withdrawalId });

  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new Error(`Withdrawal ${withdrawalId} não encontrado`);
    }

    if (withdrawal.status !== 'FAILED' && withdrawal.status !== 'PENDING') {
      throw new Error(
        'Apenas withdrawals FAILED ou PENDING podem ser retentados'
      );
    }

    log.info('🔄 Retentando withdrawal', {
      attempt: withdrawal.retryCount + 1,
    });

    // Recriar withdrawal
    const result = await createWithdrawal({
      orderId: withdrawal.orderId,
      amount: new Decimal(withdrawal.amount.toString()),
    });

    log.info('✅ Withdrawal retentado com sucesso');

    return result;
  } catch (error) {
    log.error('❌ Erro ao retentar withdrawal', error as Error);
    throw error;
  }
}

/**
 * Valida endereço da wallet conforme rede
 */
function validateWalletAddress(address: string, network: string): void {
  // Validações básicas (expandir conforme necessário)
  if (!address || address.length < 20) {
    throw new Error('Endereço de wallet inválido');
  }

  if (network === 'TRC20' && !address.startsWith('T')) {
    throw new Error('Endereço TRC20 deve começar com T');
  }

  if (network === 'ERC20' && !address.startsWith('0x')) {
    throw new Error('Endereço ERC20 deve começar com 0x');
  }

  // TODO: Validar checksum para ERC20
}

/**
 * Mapeia status do provedor para status interno
 */
function mapProviderStatus(status: string): WithdrawalStatus {
  const mapping: Record<string, WithdrawalStatus> = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SENT: 'SENT',
    CONFIRMED: 'CONFIRMED',
    FAILED: 'FAILED',
  };

  return mapping[status] || 'PENDING';
}

/**
 * Lista withdrawals pendentes que precisam de verificação
 */
export async function getPendingWithdrawals(): Promise<string[]> {
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING', 'SENT'] },
    },
    select: { id: true },
  });

  return withdrawals.map((w) => w.id);
}
