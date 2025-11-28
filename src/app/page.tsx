'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, TrendingUp, Zap, Heart, Shield } from 'lucide-react';
import { PixQRCode } from '@/components/PixQRCode';

/**
 * Landing Page Principal
 * Página de doação com QR Code PIX
 */
export default function HomePage() {
  const [pixKey, setPixKey] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar chave PIX da API
    fetch('/api/pix-key')
      .then((res) => res.json())
      .then((data) => {
        setPixKey(data.pixKey || 'exemplo@resgateprime.com.br');
        setLoading(false);
      })
      .catch(() => {
        // Fallback para env var ou exemplo
        setPixKey(process.env.NEXT_PUBLIC_PIX_KEY || 'exemplo@resgateprime.com.br');
        setLoading(false);
      });
  }, []);

  return (
    <main className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50'>
      {/* Hero Section */}
      <div className='container mx-auto px-4 py-12 md:py-12'>
        <div className='max-w-6xl mx-auto'>
          {/* Header */}
          <header className='flex justify-between items-center mb-12'>
            <div className='flex items-center gap-2'>
              <Heart className='w-8 h-8 text-blue-600' />
              <h1 className='text-2xl font-bold text-gray-900'>Resgate Prime</h1>
            </div>
            <Link
              href='/dashboard'
              className='px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition'
            >
              Dashboard →
            </Link>
          </header>

          {/* Main Content */}
          <div className='grid md:grid-cols-2 gap-12 items-center'>
            {/* Left: Text Content */}
            <div className='space-y-8'>
              <div>
                <h2 className='text-5xl font-bold text-gray-900 mb-6'>
                  Doe via PIX, transforme em{' '}
                  <span className='text-blue-600'>USDT</span>
                </h2>
                <p className='text-xl text-gray-600 mb-8'>
                  Sua doação é convertida automaticamente para criptomoeda e
                  enviada para nossa wallet. 100% transparente e rastreável.
                </p>
              </div>

              {/* Features */}
              <div className='grid gap-4'>
                <FeatureItem
                  icon={<Zap className='w-5 h-5 text-blue-600' />}
                  text='Conversão automática BRL → USDT'
                />
                <FeatureItem
                  icon={<Shield className='w-5 h-5 text-green-600' />}
                  text='100% transparente e rastreável on-chain'
                />
                <FeatureItem
                  icon={<TrendingUp className='w-5 h-5 text-purple-600' />}
                  text='Taxas baixas com rede TRC20'
                />
                <FeatureItem
                  icon={<CheckCircle className='w-5 h-5 text-orange-600' />}
                  text='Processamento em até 5 minutos'
                />
              </div>

              {/* Stats */}
              <div className='grid grid-cols-3 gap-4 pt-6 border-t border-gray-200'>
                <StatItem label='Total Doado' value='R$ 0,00' />
                <StatItem label='USDT Convertido' value='0 USDT' />
                <StatItem label='Doações' value='0' />
              </div>
            </div>

            {/* Right: QR Code */}
            <div className='flex flex-col items-center'>
              <div className='bg-white rounded-2xl shadow-xl p-8 w-full max-w-md'>
                <h3 className='text-2xl font-bold text-center mb-2 text-gray-900'>
                  Faça sua doação
                </h3>
                <p className='text-gray-700 text-center mb-6'>
                  Escaneie o QR Code com o app do seu banco
                </p>

                {/* QR Code */}
                <div className='flex justify-center mb-6'>
                  {loading ? (
                    <div className='w-64 h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center'>
                      <span className='text-gray-400'>Carregando...</span>
                    </div>
                  ) : (
                    <PixQRCode
                      pixKey={pixKey}
                      amount={selectedAmount}
                      description='Doacao Resgate Prime'
                    />
                  )}
                </div>

                {/* Amount Input */}
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Valor sugerido (R$)
                  </label>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => setSelectedAmount(10)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        selectedAmount === 10
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      R$ 10
                    </button>
                    <button
                      onClick={() => setSelectedAmount(50)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        selectedAmount === 50
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      R$ 50
                    </button>
                    <button
                      onClick={() => setSelectedAmount(100)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        selectedAmount === 100
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      R$ 100
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className='bg-blue-50 rounded-lg p-4 text-sm'>
                  <p className='mb-2 font-semibold text-gray-900'>
                    Como funciona:
                  </p>
                  <ol className='list-decimal list-inside space-y-1 text-xs text-gray-800'>
                    <li>Escaneie o QR Code</li>
                    <li>Confirme o pagamento no app</li>
                    <li>Aguarde 2-5 minutos</li>
                    <li>USDT será enviado automaticamente</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className='mt-20'>
            <h3 className='text-3xl font-bold text-center mb-12 text-gray-900'>
              Como Funciona
            </h3>
            <div className='grid md:grid-cols-4 gap-8'>
              <StepCard
                number={1}
                title='Escaneie o QR Code'
                description='Use o app do seu banco para escanear'
              />
              <StepCard
                number={2}
                title='Confirme o PIX'
                description='Valide o valor e confirme o pagamento'
              />
              <StepCard
                number={3}
                title='Conversão Automática'
                description='Sistema converte BRL → USDT automaticamente'
              />
              <StepCard
                number={4}
                title='USDT Enviado'
                description='Criptomoeda chega na wallet em minutos'
              />
            </div>
          </div>

          {/* Footer */}
          <footer className='mt-20 text-center text-gray-500 border-t border-gray-200 pt-8'>
            <p className='mb-2'>Resgate Prime © 2025</p>
            <p className='text-sm'>
              Sistema seguro de doações que salvam empresas
            </p>
            <div className='mt-4 flex justify-center gap-4'>
              <Link
                href='/dashboard'
                className='text-blue-600 hover:text-blue-700 text-sm'
              >
                Dashboard
              </Link>
              <span className='text-gray-300'>•</span>
              <a
                href='https://tronscan.org'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-700 text-sm'
              >
                Ver Transações
              </a>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

function FeatureItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className='flex items-center gap-3'>
      {icon}
      <span className='text-gray-700'>{text}</span>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='text-center'>
      <p className='text-2xl font-bold text-blue-600'>{value}</p>
      <p className='text-sm text-gray-600 mt-1'>{label}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className='text-center'>
      <div className='w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4'>
        {number}
      </div>
      <h4 className='font-semibold text-gray-900 mb-2'>{title}</h4>
      <p className='text-sm text-gray-600'>{description}</p>
    </div>
  );
}
