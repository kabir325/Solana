// src/components/token/MintToken.tsx
/**
 * MintToken Component
 * 
 * This component allows users to mint SPL tokens to their wallet.
 * It handles token minting with proper validation, error handling,
 * and user feedback throughout the process.
 */
import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import toast from 'react-hot-toast';
import { getReliableConnection, withRetry } from '@/utils/connection';

export const MintToken: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [mintAddress, setMintAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [decimals, setDecimals] = useState(9);

  const handleMintToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!mintAddress || !amount) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading('Preparing to mint tokens...');
    
    try {
      let mintPubkey: web3.PublicKey;
      try {
        mintPubkey = new web3.PublicKey(mintAddress);
      } catch (error) {
        toast.error('Invalid mint address format');
        return;
      }
      
      const reliableConnection = getReliableConnection(connection.rpcEndpoint);
      
      try {
        const mintInfo = await withRetry(() => 
          token.getMint(reliableConnection, mintPubkey)
        );
        setDecimals(mintInfo.decimals);
        console.log('Mint decimals:', mintInfo.decimals);
      } catch (error) {
        console.error('Error getting mint info:', error);
        toast.error('Could not verify mint. Please check the address and try again.');
        return;
      }
      
      const associatedTokenAddress = await token.getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );
      
      const tokenAccount = await reliableConnection.getAccountInfo(associatedTokenAddress);
      
      const transaction = new web3.Transaction();
      
      if (!tokenAccount) {
        transaction.add(
          token.createAssociatedTokenAccountInstruction(
            publicKey,
            associatedTokenAddress,
            publicKey,
            mintPubkey
          )
        );
      }
      
      const mintAmount = decimals === 0 
        ? Number(amount) 
        : Number(amount) * Math.pow(10, decimals);
      console.log('Mint amount:', mintAmount);
      
      transaction.add(
        token.createMintToInstruction(
          mintPubkey,
          associatedTokenAddress,
          publicKey,
          BigInt(mintAmount)
        )
      );
      
      const { blockhash, lastValidBlockHeight } = await reliableConnection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      toast.loading('Sending transaction...', { id: toastId });
      
      const signature = await sendTransaction(transaction, reliableConnection);
      
      toast.loading('Confirming transaction...', { id: toastId });
      
      await reliableConnection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
      
      toast.success(`Successfully minted ${amount} tokens`, { id: toastId });
      
      setAmount('');
    } catch (error) {
      console.error('Error minting tokens:', error);
      toast.error(
        error instanceof Error 
          ? `Failed to mint tokens: ${error.message}` 
          : 'Failed to mint tokens. Please check the mint address and try again.',
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#2E236C]  rounded-lg p-6 border-4 border-[#17153B] text-white">
      <h2 className="text-2xl font-bold mb-4 text-primary">Mint Tokens</h2>
      <form onSubmit={handleMintToken}>
        <div className="mb-4">
          <label className="block text-secondary text-sm font-bold mb-2" htmlFor="mintAddress">
            Token Mint Address
          </label>
          <input
            id="mintAddress"
            type="text"
            className="border border-neutral rounded w-full py-2 px-3 text-[gray-700] leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter token mint address"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-secondary text-sm font-bold mb-2" htmlFor="amount">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            min="0.000001"
            className="border border-neutral rounded w-full py-2 px-3 text-[gray-700] leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Amount to mint"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-[#17153B] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading || !publicKey}
          >
            {isLoading ? 'Minting...' : 'Mint Tokens'}
          </button>
        </div>
      </form>
    </div>
  );
};