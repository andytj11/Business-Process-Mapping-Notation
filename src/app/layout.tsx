import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientSessionProvider } from '@/components/ClientSessionProvider';

// Font configuration
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ROSE Playbook',
  description: 'A simple process mapping tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientSessionProvider>
          {children}
        </ClientSessionProvider>
      </body>
    </html>
  );
}