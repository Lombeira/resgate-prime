'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface Stats {
  totalAmount: string;
  totalDonations: number;
  pending: number;
  processed: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      // TODO: Implementar endpoint de stats
      // const response = await fetch('/api/stats');
      // const data = await response.json();

      // Mock data por enquanto
      setStats({
        totalAmount: '0.00',
        totalDonations: 0,
        pending: 0,
        processed: 0,
      });
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className='grid md:grid-cols-4 gap-6'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='bg-white rounded-lg p-6 shadow animate-pulse'>
            <div className='h-4 bg-gray-200 rounded w-1/2 mb-4'></div>
            <div className='h-8 bg-gray-200 rounded'></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className='grid md:grid-cols-4 gap-6'>
      <StatCard
        icon={<DollarSign className='w-6 h-6 text-green-600' />}
        label='Total Recebido'
        value={`R$ ${stats.totalAmount}`}
        color='green'
      />

      <StatCard
        icon={<TrendingUp className='w-6 h-6 text-blue-600' />}
        label='Total de Doações'
        value={stats.totalDonations.toString()}
        color='blue'
      />

      <StatCard
        icon={<Clock className='w-6 h-6 text-yellow-600' />}
        label='Pendentes'
        value={stats.pending.toString()}
        color='yellow'
      />

      <StatCard
        icon={<CheckCircle className='w-6 h-6 text-purple-600' />}
        label='Processadas'
        value={stats.processed.toString()}
        color='purple'
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const bgColor = {
    green: 'bg-green-50',
    blue: 'bg-blue-50',
    yellow: 'bg-yellow-50',
    purple: 'bg-purple-50',
  }[color];

  return (
    <div
      className={`${bgColor} rounded-lg p-6 shadow hover:shadow-md transition`}
    >
      <div className='flex items-center justify-between mb-4'>
        <span className='text-gray-600 text-sm font-medium'>{label}</span>
        {icon}
      </div>
      <p className='text-2xl font-bold text-gray-900'>{value}</p>
    </div>
  );
}
