import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ethereal Admin',
  description: 'Ethereal Platform Administration Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: { background: '#18181b', border: '1px solid #27272a' },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
