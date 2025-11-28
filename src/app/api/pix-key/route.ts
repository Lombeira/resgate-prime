import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

/**
 * GET /api/pix-key
 * 
 * Retorna a chave PIX configurada (para gerar QR Code)
 * Em produção, buscar do provedor via API
 */
export async function GET() {
  try {
    // TODO: Buscar chave PIX do provedor via API
    // Por enquanto, usar variável de ambiente ou retornar exemplo
    
    const pixKey = process.env.PIX_KEY || 'exemplo@resgateprime.com.br';
    
    return NextResponse.json({
      pixKey,
      // Informações adicionais se necessário
      network: 'PIX',
    });
  } catch (error) {
    console.error('Erro ao buscar chave PIX:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar chave PIX' },
      { status: 500 }
    );
  }
}

