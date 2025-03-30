// src/components/wallet/WalletInfo.tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { FC, useEffect, useState } from 'react';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

export const WalletInfo: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [network, setNetwork] = useState<string>('');

  useEffect(() => {
    // Determine which network we're connected to
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
      try {
        // Use a more reliable public RPC endpoint
        // This one has higher rate limits than the default endpoints
        const rpcUrl = network === 'Mainnet' 
          ? 'https://solana-mainnet.g.alchemy.com/v2/demo'
          : 'https://api.devnet.solana.com';
        
        const directConnection = new Connection(rpcUrl, 'confirmed');
        
        // Get balance using the direct connection
        const bal = await directConnection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      }
    };

    fetchBalance();
    // Set up an interval to refresh the balance
    const intervalId = setInterval(fetchBalance, 10000);
    
    return () => clearInterval(intervalId);
  }, [publicKey, connection, network]);

  if (!publicKey) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <h2 className="text-xl font-bold mb-2">Wallet Info</h2>
      <p className="text-sm mb-1">
        <span className="font-medium">Address: </span>
        <span className="font-mono">
          {publicKey.toString()}
        </span>
      </p>
      <p className="text-sm mb-1">
        <span className="font-medium">Balance: </span>
        {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
      </p>
      <p className="text-sm">
        <span className="font-medium">Network: </span>
        <span className={network === 'Devnet' ? 'text-yellow-400' : network === 'Mainnet' ? 'text-green-400' : 'text-blue-400'}>
          {network}
        </span>
      </p>
    </div>
  );
};