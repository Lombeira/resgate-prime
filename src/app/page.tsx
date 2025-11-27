import Link from 'next/link';
import { ArrowRight, CheckCircle, TrendingUp, Zap } from 'lucide-react';

/**
 * Página inicial pública com informações sobre doações
 */
export default function HomePage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50'>
      {/* Hero Section */}
      <div className='container mx-auto px-4 py-16'>
        <div className='max-w-4xl mx-auto text-center'>
          <h1 className='text-5xl font-bold text-gray-900 mb-6'>
            Doe via PIX, converta para USDT automaticamente
          </h1>
          <p className='text-xl text-gray-600 mb-8'>
            Sistema transparente e seguro de conversão BRL → USDT com
            processamento automático
          </p>

          <div className='flex justify-center gap-4'>
            <Link
              href='/dashboard'
              className='px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2'
            >
              Acessar Dashboard
              <ArrowRight className='w-5 h-5' />
            </Link>

            <a
              href='#como-funciona'
              className='px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition'
            >
              Como Funciona
            </a>
          </div>
        </div>

        {/* Features */}
        <div id='como-funciona' className='grid md:grid-cols-3 gap-8 mt-20'>
          <FeatureCard
            icon={<Zap className='w-8 h-8 text-blue-600' />}
            title='Conversão Automática'
            description='Recebemos seu PIX e convertemos automaticamente para USDT no melhor preço de mercado'
          />

          <FeatureCard
            icon={<CheckCircle className='w-8 h-8 text-green-600' />}
            title='100% Transparente'
            description='Todas as transações são rastreáveis on-chain e você pode acompanhar em tempo real'
          />

          <FeatureCard
            icon={<TrendingUp className='w-8 h-8 text-purple-600' />}
            title='Taxas Baixas'
            description='Utilizamos redes de baixo custo (TRC20) para maximizar o valor recebido'
          />
        </div>

        {/* Stats */}
        <div className='mt-20 bg-white rounded-2xl shadow-xl p-8'>
          <h2 className='text-2xl font-bold text-center mb-8'>
            Estatísticas do Sistema
          </h2>

          <div className='grid md:grid-cols-3 gap-8'>
            <StatCard label='Total Doado' value='R$ 0,00' />
            <StatCard label='USDT Convertido' value='0 USDT' />
            <StatCard label='Doações Processadas' value='0' />
          </div>
        </div>

        {/* Footer */}
        <footer className='mt-20 text-center text-gray-500'>
          <p className='mb-2'>Resgate Prime © 2025</p>
          <p className='text-sm'>
            Sistema seguro de conversão automática PIX → USDT
          </p>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition'>
      <div className='mb-4'>{icon}</div>
      <h3 className='text-xl font-semibold mb-2'>{title}</h3>
      <p className='text-gray-600'>{description}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='text-center'>
      <p className='text-gray-600 mb-2'>{label}</p>
      <p className='text-3xl font-bold text-blue-600'>{value}</p>
    </div>
  );
}
