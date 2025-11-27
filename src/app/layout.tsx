import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'Resgate Prime - Dashboard de Doações',
  description: 'Sistema de conversão PIX → USDT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='pt-BR'
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className='font-sans antialiased'>{children}</body>
    </html>
  );
}
