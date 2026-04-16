import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  axes: ['opsz'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Ethereal',
  description: 'Someone for you.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-ui antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
