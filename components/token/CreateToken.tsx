// src/components/token/CreateToken.tsx
/**
 * CreateToken Component
 * 
 * This component allows users to create new SPL tokens on Solana.
 * It handles the token creation process with proper validation,
 * error handling, and user feedback throughout the process.
 */
import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import toast from 'react-hot-toast';

export const CreateToken: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [decimals, setDecimals] = useState(0);
  const [initialSupply, setInitialSupply] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'devnet'>('devnet');

  const getReliableConnection = (networkType: 'mainnet' | 'devnet') => {
    const endpoint = networkType === 'mainnet' 
      ? web3.clusterApiUrl('mainnet-beta') 
      : web3.clusterApiUrl('devnet');
    
    return new web3.Connection(
      endpoint,
      {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 120000,
        disableRetryOnRateLimit: false,
      }
    );
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!tokenName || !tokenSymbol) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading('Preparing to create token...');
    
    try {
      const tokenConnection = getReliableConnection(network);
      
      const mintAccount = web3.Keypair.generate();
      console.log('Creating token with mint address:', mintAccount.publicKey.toString());
      
      const transaction = new web3.Transaction();
      
      const rentExemptBalance = await tokenConnection.getMinimumBalanceForRentExemption(token.MINT_SIZE)
        .catch(err => {
          console.error('Error getting rent exemption:', err);
          throw new Error('Failed to calculate rent exemption. Please try again later.');
        });
      
      transaction.add(
        web3.SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintAccount.publicKey,
          space: token.MINT_SIZE,
          lamports: rentExemptBalance,
          programId: token.TOKEN_PROGRAM_ID,
        })
      );
      
      transaction.add(
        token.createInitializeMintInstruction(
          mintAccount.publicKey,
          decimals,
          publicKey,
          publicKey,
          token.TOKEN_PROGRAM_ID
        )
      );
      
      const associatedTokenAddress = await token.getAssociatedTokenAddress(
        mintAccount.publicKey,
        publicKey
      );
      
      transaction.add(
        token.createAssociatedTokenAccountInstruction(
          publicKey,
          associatedTokenAddress,
          publicKey,
          mintAccount.publicKey
        )
      );
      
      if (initialSupply > 0) {
        const mintAmount = decimals === 0 
          ? initialSupply 
          : initialSupply * Math.pow(10, decimals);
        
        transaction.add(
          token.createMintToInstruction(
            mintAccount.publicKey,
            associatedTokenAddress,
            publicKey,
            BigInt(mintAmount)
          )
        );
      }
      
      const { blockhash, lastValidBlockHeight } = await tokenConnection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      toast.loading('Sending transaction...', { id: toastId });
      
      const signature = await sendTransaction(transaction, tokenConnection, {
        signers: [mintAccount]
      });
      
      setLastSignature(signature);
      
      toast.loading('Confirming transaction...', { id: toastId });
      
      await tokenConnection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
      
      toast.success(
        <div>
          <p>Token created successfully!</p>
          <p className="text-xs mt-1">Mint Address: {mintAccount.publicKey.toString()}</p>
        </div>,
        { id: toastId, duration: 10000 }
      );
      
      setTokenName('');
      setTokenSymbol('');
      setInitialSupply(1000);
    } catch (error) {
      console.error('Error creating token:', error);
      toast.error(
        error instanceof Error 
          ? `Failed to create token: ${error.message}` 
          : 'Failed to create token. Please try again later.',
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecimalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setDecimals(0);
      return;
    }
    
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 9) {
      setDecimals(parsed);
    }
  };

  return (
    <div className="bg-[#2E236C]  rounded-lg p-6 border-4 border-[#17153B] text-white">
      <h2 className="text-2xl font-bold mb-4 text-primary">Create New Token</h2>
      <form onSubmit={handleCreateToken}>
        <div className="mb-4">
          <label className="block text-secondary text-sm font-bold mb-2" htmlFor="tokenName">
            Token Name
          </label>
          <input
            id="tokenName"
            type="text"
            className=" border border-neutral rounded w-full py-2 px-3 text-[gray-700] leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="My Token"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-secondary text-sm font-bold mb-2" htmlFor="tokenSymbol">
            Token Symbol
          </label>
          <input
            id="tokenSymbol"
            type="text"
            className="border border-neutral rounded w-full py-2 px-3 text-[gray-700] leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="MTK"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-secondary text-sm font-bold mb-2" htmlFor="decimals">
            Decimals (0-9)
          </label>
          <input
            id="decimals"
            type="number"
            min="0"
            max="9"
            className="border border-neutral rounded w-full py-2 px-3 text-[gray-700] leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g., 9"
            value={decimals}
            onChange={handleDecimalsChange}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400 mt-1">
            Lower decimals (0-2) are recommended to save on transaction fees.
          </p>
        </div>
        <div className="mb-6">
          <label className="block text-secondary text-sm font-bold mb-2" htmlFor="initialSupply">
            Initial Supply
          </label>
          <input
            id="initialSupply"
            type="number"
            min="0"
            className="border border-neutral rounded w-full py-2 px-3 text-[gray-700] leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g., 1000"
            value={initialSupply}
            onChange={(e) => setInitialSupply(Number(e.target.value))}
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
            {isLoading ? 'Creating...' : 'Create Token'}
          </button>
        </div>
      </form>
      
      {lastSignature && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            Last transaction: 
            <a 
              href={`https://explorer.solana.com/tx/${lastSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-accent hover:text-accent-dark"
            >
              View on Solana Explorer
            </a>
          </p>
        </div>
      )}
    </div>
  );
};