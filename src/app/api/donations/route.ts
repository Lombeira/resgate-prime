import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';

/**
 * GET /api/donations
 *
 * Lista doações com filtros e paginação
 * Endpoint protegido para dashboard
 */

export async function GET(req: NextRequest) {
  const log = createLogger({ endpoint: '/api/donations' });

  try {
    // Autenticação simples (em produção usar JWT/session)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !validateAuth(authHeader)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parâmetros de query
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construir filtros
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.receivedAt = {};
      if (startDate) where.receivedAt.gte = new Date(startDate);
      if (endDate) where.receivedAt.lte = new Date(endDate);
    }

    // Buscar doações
    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: {
          order: {
            include: {
              withdrawal: true,
            },
          },
        },
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.donation.count({ where }),
    ]);

    // Calcular estatísticas
    const stats = await prisma.donation.aggregate({
      where,
      _sum: { amountBrl: true },
      _count: true,
    });

    log.info('✅ Doações listadas', { count: donations.length, total });

    return NextResponse.json({
      donations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalAmount: stats._sum.amountBrl?.toString() || '0',
        totalDonations: stats._count,
      },
    });
  } catch (error) {
    log.error('❌ Erro ao listar doações', error as Error);
    return NextResponse.json(
      { error: 'Erro ao listar doações' },
      { status: 500 }
    );
  }
}

/**
 * Validação simples de auth (substituir por JWT em produção)
 */
function validateAuth(authHeader: string): boolean {
  const token = authHeader.replace('Bearer ', '');
  const validToken = process.env.INTERNAL_API_SECRET;
  return token === validToken;
}
