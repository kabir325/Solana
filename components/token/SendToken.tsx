/**
 * SendToken Component
 * 
 * This component allows users to send SPL tokens to other wallets.
 * It handles token transfers with proper validation, error handling,
 * and user feedback throughout the process.
 */
import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import toast from 'react-hot-toast';
import { getReliableConnection, withRetry } from '@/utils/connection';

export const SendToken: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [mintAddress, setMintAddress] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [decimals, setDecimals] = useState(9);

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
    const toastId = toast.loading('Preparing transaction...');
    
    try {
      const reliableConnection = getReliableConnection(connection.rpcEndpoint);
      
      let mintPubkey: web3.PublicKey;
      let recipientPubkey: web3.PublicKey;
      
      try {
        mintPubkey = new web3.PublicKey(mintAddress);
      } catch (error) {
        toast.error('Invalid mint address format', { id: toastId });
        return;
      }
      
      try {
        recipientPubkey = new web3.PublicKey(recipientAddress);
      } catch (error) {
        toast.error('Invalid recipient address format', { id: toastId });
        return;
      }
      
      let actualDecimals = 9; // Default value
      
      try {
        const mintInfo = await withRetry(() => 
          token.getMint(reliableConnection, mintPubkey)
        );
        actualDecimals = mintInfo.decimals;
        setDecimals(mintInfo.decimals);
        console.log('Token decimals:', mintInfo.decimals);
      } catch (error) {
        console.error('Error getting mint info:', error);
        toast.error('Could not verify token mint. Please check the address.', { id: toastId });
        return;
      }
      
      const sourceTokenAddress = await token.getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );
      
      const sourceAccountInfo = await reliableConnection.getAccountInfo(sourceTokenAddress);
      if (!sourceAccountInfo) {
        toast.error('You don\'t have a token account for this token', { id: toastId });
        return;
      }
      
      const destinationTokenAddress = await token.getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey
      );
      
      const transaction = new web3.Transaction();
      
      const destinationAccountInfo = await reliableConnection.getAccountInfo(destinationTokenAddress);
      
      if (!destinationAccountInfo) {
        transaction.add(
          token.createAssociatedTokenAccountInstruction(
            publicKey,
            destinationTokenAddress,
            recipientPubkey,
            mintPubkey
          )
        );
      }
      
      // Convert integer amount to the proper token amount with decimals
      const transferAmount = Number(amount) * Math.pow(10, actualDecimals);
      
      console.log('Transfer amount:', transferAmount);
      
      transaction.add(
        token.createTransferInstruction(
          sourceTokenAddress,
          destinationTokenAddress,
          publicKey,
          BigInt(Math.floor(transferAmount))
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
      
      toast.success(
        `Successfully sent ${amount} tokens to ${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}`,
        { id: toastId }
      );
      
      setAmount('');
      setRecipientAddress('');
    } catch (error) {
      console.error('Error sending tokens:', error);
      toast.error(
        error instanceof Error 
          ? `Failed to send tokens: ${error.message}` 
          : 'Failed to send tokens. Please check the addresses and try again.',
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#2E236C]  rounded-lg p-6 border-4 border-[#17153B] text-white">
      <h2 className="text-2xl font-bold mb-4 text-primary">Send Tokens</h2>
      <form onSubmit={handleSendToken}>
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
        <div className="mb-4">
          <label className="block text-secondary text-sm font-bold mb-2" htmlFor="recipientAddress">
            Recipient Address
          </label>
          <input
            id="recipientAddress"
            type="text"
            className="border border-neutral rounded w-full py-2 px-3 text-[gray-700] leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter recipient wallet address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-secondary text-sm font-bold mb-2" htmlFor="sendAmount">
            Amount
          </label>
          <input
            id="sendAmount"
            type="number"
            min="1"
            step="1"
            className="border border-neutral rounded w-full py-2 px-3 text-[gray-700] leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Amount to send (whole tokens)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-[#F6F8D5] mt-1">Enter whole token amounts (no decimals needed)</p>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-[#17153B] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 ${
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