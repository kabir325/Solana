/**
 * AirdropButton Component
 * 
 * This component provides a button to request an airdrop of SOL
 * on the Solana devnet for testing purposes.
 */
import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import toast from 'react-hot-toast';

export const AirdropButton: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isAirdropping, setIsAirdropping] = useState(false);

  const handleAirdrop = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsAirdropping(true);
    const toastId = toast.loading('Requesting SOL airdrop...');

    try {
      const signature = await connection.requestAirdrop(
        publicKey,
        1 * LAMPORTS_PER_SOL
      );

      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Successfully received 1 SOL', { id: toastId });
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      toast.error(
        'Failed to request airdrop. The faucet may be rate-limited. Try again later.',
        { id: toastId }
      );
    } finally {
      setIsAirdropping(false);
    }
  };

  return (
    <button
      onClick={handleAirdrop}
      disabled={isAirdropping || !publicKey}
      className={`bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded transition-colors duration-200 ${
        isAirdropping ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isAirdropping ? 'Requesting...' : 'Get 1 SOL (Devnet)'}
    </button>
  );
};