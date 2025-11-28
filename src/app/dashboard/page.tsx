import { Suspense } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DonationsList } from '@/components/DonationsList';
import { StatsCards } from '@/components/StatsCards';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Home } from 'lucide-react';

/**
 * Dashboard principal para visualizar doações e status
 * Rota: /dashboard
 */
export default function DashboardPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <DashboardHeader />

      <main className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Dashboard de Doações
          </h1>
          <Link
            href='/'
            className='flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition'
          >
            <Home className='w-5 h-5' />
            Voltar para doação
          </Link>
        </div>

        {/* Stats */}
        <Suspense fallback={<LoadingSkeleton />}>
          <StatsCards />
        </Suspense>

        {/* Donations List */}
        <div className='mt-8'>
          <Suspense fallback={<LoadingSkeleton />}>
            <DonationsList />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
