// src/components/layout/Header.tsx
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnect } from '@/components/wallet/WalletConnect';

const Header: React.FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <header className="bg-gradient-to-r from-purple-700 to-indigo-800 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <svg
                className="h-8 w-8 text-yellow-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-white font-bold text-xl">Solana Token App</span>
            </a>
          </div>
          
          <div className="flex items-center">
            {connected && publicKey && (
              <div className="hidden md:block mr-4">
                <div className="bg-white/10 rounded-md px-3 py-1">
                  <span className="text-white text-sm font-medium">
                    {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                  </span>
                </div>
              </div>
            )}
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;