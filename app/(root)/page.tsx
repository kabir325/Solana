// src/app/page.tsx
/**
 * Home Page Component
 * 
 * This is the main page of the Solana Token App.
 * It displays different content based on whether a wallet is connected.
 */
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
    <div className="bg-[#433D8B]">
      <div className="px-4 py-8">
        <Toaster position="top-right" />
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 text-primary">Solana Token App</h1>
          <p className="text-xl text-secondary mb-6">Create, mint, and send Solana tokens on the Solana devnet</p>
          
          {!connected && (
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          )}
        </div>
    
        {connected ? (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <WalletInfo />
                <TokenList />
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="bg-[#2E236C]  rounded-lg p-6 border-4 border-[#17153B] text-white">
                  <h2 className="text-2xl font-bold mb-2 text-primary">Token Management</h2>
                  <p className="text-secondary mb-4">
                    Use the tools below to create, mint, and send SPL tokens on the Solana devnet.
                  </p>
                </div>
                <CreateToken />
                <MintToken />
                <SendToken />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg max-w-2xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-4 text-primary">Get Started with Solana Tokens</h2>
            <p className="text-secondary mb-6">
              Connect your Solana wallet to create and manage tokens on the devnet.
            </p>
            <div className="bg-white/50 p-4 rounded-lg max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-primary mb-2">What you can do:</h3>
              <ul className="text-left text-secondary space-y-2 mb-6">
                <li>• Create your own SPL tokens</li>
                <li>• Mint additional tokens to your wallet</li>
                <li>• Send tokens to other wallets</li>
                <li>• View your token balances</li>
              </ul>
              <p className="text-sm text-gray-700 mb-4">
                Supported wallets: Phantom, Solflare
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    );
};
