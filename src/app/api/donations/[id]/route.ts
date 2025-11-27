import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';

/**
 * GET /api/donations/:id
 *
 * Busca detalhes de uma doação específica
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const log = createLogger({
    endpoint: '/api/donations/:id',
    donationId: params.id,
  });

  try {
    const donation = await prisma.donation.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            withdrawal: true,
          },
        },
        webhookEvents: {
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!donation) {
      return NextResponse.json(
        { error: 'Doação não encontrada' },
        { status: 404 }
      );
    }

    log.info('✅ Doação encontrada');

    return NextResponse.json({ donation });
  } catch (error) {
    log.error('❌ Erro ao buscar doação', error as Error);
    return NextResponse.json(
      { error: 'Erro ao buscar doação' },
      { status: 500 }
    );
  }
}
