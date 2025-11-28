'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Donation {
  id: string;
  amountBrl: string;
  payerName?: string;
  status: string;
  receivedAt: string;
  order?: {
    filledUsdt?: string;
    status: string;
    withdrawal?: {
      txHash?: string;
      status: string;
    };
  };
}

export function DonationsList() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  async function fetchDonations() {
    try {
      // TODO: Implementar com auth real
      // const response = await fetch('/api/donations', {
      //   headers: {
      //     Authorization: `Bearer ${getToken()}`,
      //   },
      // });
      // const data = await response.json();
      // setDonations(data.donations);

      // Mock data por enquanto
      setDonations([]);
    } catch (error) {
      console.error('Erro ao carregar doações:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-bold mb-4 text-gray-900'>
          Carregando...
        </h2>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow p-6 text-center'>
        <AlertCircle className='w-12 h-12 text-gray-500 mx-auto mb-4' />
        <h2 className='text-xl font-bold mb-2 text-gray-900'>
          Nenhuma doação encontrada
        </h2>
        <p className='text-gray-700'>
          As doações aparecerão aqui assim que forem recebidas via PIX
        </p>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow overflow-hidden'>
      <div className='p-6 border-b border-gray-200'>
        <h2 className='text-xl font-bold text-gray-900'>
          Doações Recentes
        </h2>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Data
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Doador
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Valor BRL
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                USDT
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                TX Hash
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {donations.map((donation) => (
              <tr key={donation.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {format(new Date(donation.receivedAt), 'dd/MM/yyyy HH:mm', {
                    locale: ptBR,
                  })}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {donation.payerName || 'Anônimo'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                  R$ {parseFloat(donation.amountBrl).toFixed(2)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {donation.order?.filledUsdt
                    ? `${parseFloat(donation.order.filledUsdt).toFixed(2)} USDT`
                    : '-'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <StatusBadge status={donation.status} />
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {donation.order?.withdrawal?.txHash ? (
                    <a
                      href={`https://tronscan.org/#/transaction/${donation.order.withdrawal.txHash}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:underline'
                    >
                      {donation.order.withdrawal.txHash.substring(0, 8)}...
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Pendente',
    },
    PROCESSING: {
      icon: Clock,
      color: 'bg-blue-100 text-blue-800',
      label: 'Processando',
    },
    PROCESSED: {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      label: 'Concluído',
    },
    FAILED: {
      icon: XCircle,
      color: 'bg-red-100 text-red-800',
      label: 'Falhou',
    },
  }[status] || {
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-800',
    label: status,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className='w-3 h-3' />
      {config.label}
    </span>
  );
}
