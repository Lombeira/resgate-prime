'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { generatePixPayload, validatePixKey } from '@/lib/pix';

interface PixQRCodeProps {
  pixKey: string;
  amount?: number;
  description?: string;
}

/**
 * Componente que gera QR Code PIX
 * Formato: EMV QR Code padrão brasileiro
 */
export function PixQRCode({ pixKey, amount, description }: PixQRCodeProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [pixKey, amount, description]);

  async function generateQRCode() {
    try {
      setLoading(true);
      setError('');

      // Validar chave PIX
      if (!validatePixKey(pixKey)) {
        throw new Error('Chave PIX inválida');
      }

      // Gerar payload PIX (formato EMV)
      const pixPayload = generatePixPayload({
        pixKey,
        amount,
        description,
      });

      // Gerar QR Code
      const dataUrl = await QRCode.toDataURL(pixPayload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });

      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center w-64 h-64 bg-gray-100 rounded-lg animate-pulse'>
        <div className='text-gray-400'>Gerando QR Code...</div>
      </div>
    );
  }

  if (error || !qrCodeDataUrl) {
    return (
      <div className='flex flex-col items-center justify-center w-64 h-64 bg-red-50 rounded-lg p-4'>
        <div className='text-red-500 text-center'>
          {error || 'Erro ao gerar QR Code'}
        </div>
        <p className='text-xs text-gray-500 mt-2 text-center'>
          Verifique a chave PIX configurada
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-4'>
      <div className='bg-white p-4 rounded-lg shadow-lg'>
        <img
          src={qrCodeDataUrl}
          alt='QR Code PIX'
          className='w-64 h-64'
          draggable={false}
        />
      </div>
      <p className='text-sm text-gray-600 text-center max-w-xs'>
        Escaneie com o app do seu banco para fazer a doação
      </p>
      {amount && (
        <p className='text-xs text-gray-500'>
          Valor: R$ {amount.toFixed(2)}
        </p>
      )}
    </div>
  );
}

