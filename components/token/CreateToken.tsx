// src/components/token/CreateToken.tsx
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
  const [decimals, setDecimals] = useState(0); // Changed default to 0 to save SOL
  const [isLoading, setIsLoading] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'devnet'>('devnet'); // Add network selection

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
    
    try {
      // Select endpoint based on network choice
      const endpoint = network === 'mainnet' 
        ? 'https://solana-mainnet.g.alchemy.com/v2/demo' // Use Alchemy's endpoint which has higher rate limits
        : 'https://api.devnet.solana.com';
      
      // Create a dedicated connection for token creation with longer timeout
      const tokenConnection = new web3.Connection(
        endpoint,
        {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 90000, // 90 seconds timeout
        }
      );
      
      // Create a new token mint
      const mintAccount = web3.Keypair.generate();
      console.log('Creating token with mint address:', mintAccount.publicKey.toString());
      
      // Create transaction for token creation
      const transaction = new web3.Transaction();
      
      // Add instruction to create account for the mint
      transaction.add(
        web3.SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintAccount.publicKey,
          space: token.MINT_SIZE,
          lamports: await tokenConnection.getMinimumBalanceForRentExemption(token.MINT_SIZE),
          programId: token.TOKEN_PROGRAM_ID,
        })
      );
      
      // Add instruction to initialize the mint
      transaction.add(
        token.createInitializeMintInstruction(
          mintAccount.publicKey,  // mint account
          decimals,               // decimals
          publicKey,              // mint authority
          publicKey,              // freeze authority (you can use null for none)
          token.TOKEN_PROGRAM_ID
        )
      );
      
      // Create associated token account for the user
      const associatedTokenAccount = await token.getAssociatedTokenAddress(
        mintAccount.publicKey,
        publicKey
      );
      
      // Add instruction to create associated token account
      transaction.add(
        token.createAssociatedTokenAccountInstruction(
          publicKey,                 // payer
          associatedTokenAccount,    // associated token account
          publicKey,                 // owner
          mintAccount.publicKey      // mint
        )
      );
      
      // Add instruction to mint some tokens to the user's wallet
      // For testing, mint a smaller amount to save on transaction size
      const mintAmount = decimals === 0 ? 1000 : 1000 * Math.pow(10, decimals);
      
      transaction.add(
        token.createMintToInstruction(
          mintAccount.publicKey,      // mint
          associatedTokenAccount,     // destination
          publicKey,                  // authority
          BigInt(mintAmount),         // amount (1000 tokens)
          []                          // signer array
        )
      );
      
      // Add recent blockhash to transaction
      transaction.recentBlockhash = (await tokenConnection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;
      
      // Send the transaction using the dedicated connection
      const signature = await sendTransaction(transaction, tokenConnection, {
        signers: [mintAccount],
      });
      
      setLastSignature(signature);
      console.log('Transaction sent with signature:', signature);
      
      toast.loading('Creating token... This may take a minute', { id: 'creating-token' });
      
      // Wait for confirmation with longer timeout
      const confirmation = await tokenConnection.confirmTransaction(
        signature, 
        'confirmed'
      );
      
      if (confirmation.value.err) {
        throw new Error('Transaction confirmed but failed');
      }
      
      toast.dismiss('creating-token');
      
      // Store the mint address and token account for future use
      const mintAddress = mintAccount.publicKey.toString();
      localStorage.setItem('lastCreatedToken', mintAddress);
      localStorage.setItem('lastTokenAccount', associatedTokenAccount.toString());
      
      toast.success(
        <div>
          <p>Token created successfully!</p>
          <p className="font-mono text-xs break-all mt-1">Mint: {mintAddress}</p>
          <p className="font-mono text-xs break-all mt-1">Token Account: {associatedTokenAccount.toString()}</p>
          <p className="text-xs mt-1">Network: {network}</p>
        </div>,
        { duration: 10000 }
      );
      
      // Reset form
      setTokenName('');
      setTokenSymbol('');
      setDecimals(0);
    } catch (error) {
      console.error('Error creating token:', error);
      toast.dismiss('creating-token');
      
      // More specific error message
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          toast.error('Access forbidden. Try using a different wallet or network.');
        } else if (error.message.includes('timeout') || error.message.includes('was not confirmed')) {
          toast.error(
            <div>
              <p>Transaction may have succeeded but wasn't confirmed in time.</p>
              <p className="mt-1">Check your wallet for the new token or try again.</p>
            </div>
          );
          if (lastSignature) {
            const explorerUrl = `https://${network === 'devnet' ? 'explorer.solana.com/?cluster=devnet' : 'explorer.solana.com'}/tx/${lastSignature}`;
            toast.info(
              <div>
                <p>Check transaction status:</p>
                <a 
                  href={explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  View on Solana Explorer
                </a>
              </div>,
              { duration: 10000 }
            );
          }
        } else if (error.message.includes('insufficient funds')) {
          toast.error('Not enough SOL in your wallet for this operation.');
        } else {
          toast.error(`Failed to create token: ${error.message}`);
        }
      } else {
        toast.error('Failed to create token. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle decimals change with validation
  const handleDecimalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If empty, set to 0
    if (value === '') {
      setDecimals(0);
      return;
    }
    
    // Parse as integer and validate
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 9) {
      setDecimals(parsed);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Create New Token</h2>
      <form onSubmit={handleCreateToken}>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="tokenName">
            Token Name
          </label>
          <input
            id="tokenName"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="My Token"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="tokenSymbol">
            Token Symbol
          </label>
          <input
            id="tokenSymbol"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="MTK"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="decimals">
            Decimals
          </label>
          <input
            id="decimals"
            type="number"
            min="0"
            max="9"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={decimals.toString()}
            onChange={handleDecimalsChange}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Lower values (0-2) use less SOL. Standard is 9 (like SOL).
          </p>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Network
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="network"
                value="devnet"
                checked={network === 'devnet'}
                onChange={() => setNetwork('devnet')}
                disabled={isLoading}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Devnet (Recommended for testing)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="network"
                value="mainnet"
                checked={network === 'mainnet'}
                onChange={() => setNetwork('mainnet')}
                disabled={isLoading}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Mainnet</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use Devnet for testing to save real SOL.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading || !publicKey}
          >
            {isLoading ? 'Creating...' : 'Create Token'}
          </button>
        </div>
      </form>
    </div>
  );
};