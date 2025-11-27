import { createLogger } from '@/lib/logger';
import { checkWithdrawalStatus } from '@/services/withdrawalService';
import { enqueueJob } from '@/lib/queue';

/**
 * Worker que verifica status de um withdrawal
 */

export interface ProcessWithdrawalCheckData {
  withdrawalId: string;
}

export async function processWithdrawalCheck(
  data: ProcessWithdrawalCheckData
): Promise<void> {
  const log = createLogger({
    worker: 'processWithdrawalCheck',
    withdrawalId: data.withdrawalId,
  });

  try {
    log.info('🔍 Verificando status do withdrawal');

    const result = await checkWithdrawalStatus(data.withdrawalId);

    log.info('✅ Status verificado', { status: result.status });

    // Se ainda está pendente/processing, reenfileirar
    if (result.status === 'PENDING' || result.status === 'PROCESSING') {
      log.info('⏳ Withdrawal ainda pendente, verificando novamente em 1 min');
      await enqueueJob('checkWithdrawalStatus', data, { delay: 60000 });
      return;
    }

    // Se foi enviado mas não confirmado, continuar verificando
    if (result.status === 'SENT') {
      log.info('📤 Withdrawal enviado, aguardando confirmação on-chain');
      await enqueueJob('checkWithdrawalStatus', data, { delay: 120000 }); // 2 min
      return;
    }

    // Se confirmado, está completo
    if (result.status === 'CONFIRMED') {
      log.info('✅ Withdrawal confirmado!', { txHash: result.txHash });
    }

    // Se falhou, já foi tratado pelo service
  } catch (error) {
    log.error('❌ Erro ao verificar withdrawal', error as Error);
    throw error;
  }
}
