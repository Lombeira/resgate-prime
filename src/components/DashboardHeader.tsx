'use client';

import Link from 'next/link';
import { Home, RefreshCw } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className='bg-white border-b border-gray-200'>
      <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
        <Link
          href='/'
          className='flex items-center gap-2 text-xl font-bold text-blue-600'
        >
          <Home className='w-6 h-6' />
          Resgate Prime
        </Link>

        <nav className='flex items-center gap-4'>
          <Link
            href='/dashboard'
            className='text-gray-600 hover:text-gray-900 transition'
          >
            Dashboard
          </Link>

          <button
            onClick={() => window.location.reload()}
            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
          >
            <RefreshCw className='w-4 h-4' />
            Atualizar
          </button>
        </nav>
      </div>
    </header>
  );
}
