import { Suspense } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DonationsList } from '@/components/DonationsList';
import { StatsCards } from '@/components/StatsCards';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

/**
 * Dashboard principal para visualizar doações e status
 */
export default function DashboardPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <DashboardHeader />

      <main className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>
          Dashboard de Doações
        </h1>

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
