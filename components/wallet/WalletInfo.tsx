// src/components/wallet/WalletInfo.tsx
/**
 * WalletInfo Component
 * 
 * This component displays information about the connected wallet,
 * including the wallet address, SOL balance, and network.
 * It also provides an airdrop button for getting test SOL on devnet.
 */
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { FC, useEffect, useState } from 'react';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import toast from 'react-hot-toast';
import { AirdropButton } from './AirdropButton';

export const WalletInfo: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [network, setNetwork] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  useEffect(() => {
    const endpoint = connection.rpcEndpoint;
    if (endpoint.includes('devnet')) {
      setNetwork('Devnet');
    } else if (endpoint.includes('testnet')) {
      setNetwork('Testnet');
    } else if (endpoint.includes('mainnet')) {
      setNetwork('Mainnet');
    } else {
      setNetwork('Custom RPC');
    }

    if (!publicKey) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      const now = Date.now();
      if (now - lastFetchTime < 3000 && balance !== null) {
        return;
      }
      
      if (isLoading) return;
      
      setIsLoading(true);
      try {
        const rpcUrl = 'https://api.devnet.solana.com';
        
        const directConnection = new Connection(rpcUrl, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000,
        });
        
        const bal = await directConnection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
        setLastFetchTime(now);
      } catch (error) {
        console.error('Error fetching balance:', error);
        if (balance === null) {
          toast.error('Failed to fetch balance. Will retry shortly.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    
    const intervalId = setInterval(fetchBalance, 30000);
    
    return () => clearInterval(intervalId);
  }, [publicKey, connection, balance, isLoading, lastFetchTime]);

  if (!publicKey) return null;

  return (
    <div className="bg-[#2E236C]  rounded-lg p-6 border-4 border-[#17153B] text-white">
      <h2 className="text-2xl font-bold mb-4 text-primary">Wallet Info</h2>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center pb-2">
            <p className="text-primary font-mono text-sm  truncate">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicKey.toString());
                toast.success('Address copied to clipboard');
              }}
              className="ml-2 text-accent hover:text-accent-dark"
              title="Copy address"
            >
              Copy
            </button>
          </div>
        </div>
        
        <div className='flex justify-between items-center pb-2'>
          <p className="text-secondary text-sm font-bold mb-1">Balance:</p>
          <p className="text-primary">
            {isLoading && balance === null ? (
              <span className="text-gray-500">Loading...</span>
            ) : balance !== null ? (
              `${balance.toFixed(4)} SOL`
            ) : (
              <span className="text-gray-500">Unknown</span>
            )}
          </p>
        </div>
        
        <div className='flex justify-between items-center pb-2'>
          <p className="text-secondary text-sm font-bold mb-1">Network:</p>
          <p className="text-primary">{network}</p>
        </div>
        
        {network === 'Devnet' && (
          <div className="bg-[#17153B]  text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200">
            <AirdropButton />
          </div>
        )}
      </div>
    </div>
  );
};