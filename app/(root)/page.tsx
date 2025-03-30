// src/app/page.tsx
'use client';

import { WalletConnect } from '@/components/wallet/WalletConnect';
import { WalletInfo } from '@/components/wallet/WalletInfo';
import { CreateToken } from '@/components/token/CreateToken';
import { MintToken } from '@/components/token/MintToken';
import { SendToken } from '@/components/token/SendToken';
import { TokenList } from '@/components/token/TokenList';
import { useWallet } from '@solana/wallet-adapter-react';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">Solana Token App</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">Create, mint, and send Solana tokens on devnet</p>
      </div>

      <div className="flex justify-center mb-8">
        <WalletConnect />
      </div>

      {connected ? (
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <WalletInfo />
          </div>
          
          <div className="mb-8">
            <TokenList />
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            <CreateToken />
            <MintToken />
            <SendToken />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please connect your Solana wallet to create and manage tokens.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supported wallets: Phantom, Solflare
          </p>
        </div>
      )}
    </div>
  );
}