'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import WalletProvider from '@/components/wallet/WalletProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <div className="">
            <Header />
            <main className="">{children}</main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}