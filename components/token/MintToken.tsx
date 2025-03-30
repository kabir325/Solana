// src/components/token/MintToken.tsx
import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import toast from 'react-hot-toast';

export const MintToken: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [mintAddress, setMintAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    
    try {
      // Convert mint address string to PublicKey
      const mintPubkey = new web3.PublicKey(mintAddress);
      
      // Get or create associated token account
      const associatedTokenAddress = await token.getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );
      
      // Check if the associated token account exists
      const tokenAccount = await connection.getAccountInfo(associatedTokenAddress);
      
      // Create a new transaction
      const transaction = new web3.Transaction();
      
      // If token account doesn't exist, create one
      if (!tokenAccount) {
        transaction.add(
          token.createAssociatedTokenAccountInstruction(
            publicKey,               // payer
            associatedTokenAddress,  // associated token account
            publicKey,               // owner
            mintPubkey               // mint
          )
        );
      }
      
      // Add instruction to mint tokens
      transaction.add(
        token.createMintToInstruction(
          mintPubkey,              // mint
          associatedTokenAddress,  // destination
          publicKey,               // authority
          Number(amount) * Math.pow(10, 9)  // amount (with decimals)
        )
      );
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`Successfully minted ${amount} tokens`);
      
      // Reset form
      setAmount('');
    } catch (error) {
      console.error('Error minting tokens:', error);
      toast.error('Failed to mint tokens. Please check the mint address and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Mint Tokens</h2>
      <form onSubmit={handleMintToken}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mintAddress">
            Token Mint Address
          </label>
          <input
            id="mintAddress"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter token mint address"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            min="1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Amount to mint"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
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