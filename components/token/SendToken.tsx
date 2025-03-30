// src/components/token/SendToken.tsx
import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import toast from 'react-hot-toast';

export const SendToken: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [mintAddress, setMintAddress] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!mintAddress || !recipientAddress || !amount) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert addresses to PublicKeys
      const mintPubkey = new web3.PublicKey(mintAddress);
      const recipientPubkey = new web3.PublicKey(recipientAddress);
      
      // Get source token account (sender's associated token account)
      const sourceTokenAddress = await token.getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );
      
      // Get destination token account (recipient's associated token account)
      const destinationTokenAddress = await token.getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey
      );
      
      // Create a new transaction
      const transaction = new web3.Transaction();
      
      // Check if recipient's token account exists
      const destinationAccountInfo = await connection.getAccountInfo(destinationTokenAddress);
      
      // If recipient's token account doesn't exist, create one
      if (!destinationAccountInfo) {
        transaction.add(
          token.createAssociatedTokenAccountInstruction(
            publicKey,                 // payer
            destinationTokenAddress,   // associated token account
            recipientPubkey,           // owner
            mintPubkey                 // mint
          )
        );
      }
      
      // Add instruction to transfer tokens
      transaction.add(
        token.createTransferInstruction(
          sourceTokenAddress,        // source
          destinationTokenAddress,   // destination
          publicKey,                 // authority
          Number(amount) * Math.pow(10, 9)  // amount (with decimals)
        )
      );
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`Successfully sent ${amount} tokens to ${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}`);
      
      // Reset form
      setAmount('');
      setRecipientAddress('');
    } catch (error) {
      console.error('Error sending tokens:', error);
      toast.error('Failed to send tokens. Please check the addresses and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Send Tokens</h2>
      <form onSubmit={handleSendToken}>
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
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientAddress">
            Recipient Address
          </label>
          <input
            id="recipientAddress"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter recipient wallet address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sendAmount">
            Amount
          </label>
          <input
            id="sendAmount"
            type="number"
            min="0.000001"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading || !publicKey}
          >
            {isLoading ? 'Sending...' : 'Send Tokens'}
          </button>
        </div>
      </form>
    </div>
  );
};