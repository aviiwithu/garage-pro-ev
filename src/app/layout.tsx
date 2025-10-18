
'use client';

import type { ReactNode } from 'react';
import './globals.css';

import { PT_Sans, Space_Grotesk, Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthProvider';
import { DataProvider } from '@/context/DataProvider';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${ptSans.variable} ${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
