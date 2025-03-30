// src/components/token/TokenList.tsx
import { FC, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import toast from 'react-hot-toast';

interface TokenInfo {
  mint: string;
  balance: number;
  decimals: number;
  network: string;
}
 
export const TokenList: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState<string>('');
  const [manualToken, setManualToken] = useState<any>(null);
  const [mintAmount, setMintAmount] = useState<string>('');
  const [creatingATA, setCreatingATA] = useState(false);
  const [mintingTokens, setMintingTokens] = useState(false);

  // Add function to fetch specific token info
  const fetchSpecificToken = async () => {
    if (!mintAddress) {
      toast.error('Please enter a mint address');
      return;
    }

    try {
      toast.loading('Fetching token info...', { id: 'fetch-token' });
      
      // Try with multiple endpoints - both mainnet and devnet
      const endpoints = [
        'https://api.mainnet-beta.solana.com',
        'https://solana-mainnet.g.alchemy.com/v2/demo',
        'https://api.devnet.solana.com',
        'https://devnet.genesysgo.net'
      ];
      
      let mintInfo = null;
      let foundEndpoint = '';
      
      for (const endpoint of endpoints) {
        try {
          const conn = new web3.Connection(endpoint, 'confirmed');
          const mintPubkey = new web3.PublicKey(mintAddress);
          
          // Get mint info
          mintInfo = await token.getMint(conn, mintPubkey);
          
          if (mintInfo) {
            console.log('Found token on', endpoint);
            console.log('Token info:', mintInfo);
            foundEndpoint = endpoint;
            
            // Format the token info for display
            setManualToken({
              mint: mintAddress,
              supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
              decimals: mintInfo.decimals,
              mintAuthority: mintInfo.mintAuthority?.toBase58() || 'None',
              freezeAuthority: mintInfo.freezeAuthority?.toBase58() || 'None',
              isInitialized: mintInfo.isInitialized,
              network: endpoint.includes('devnet') ? 'Devnet' : 'Mainnet'
            });
            
            toast.dismiss('fetch-token');
            toast.success('Token found!');
            
            // Check if user has an associated token account for this token
            if (publicKey) {
              try {
                const ataAddress = await token.getAssociatedTokenAddress(
                  mintPubkey,
                  publicKey
                );
                const ataInfo = await conn.getAccountInfo(ataAddress);
                
                if (ataInfo) {
                  console.log('User has an ATA for this token');
                } else {
                  console.log('User does not have an ATA for this token yet');
                }
              } catch (err) {
                console.log('Error checking ATA:', err);
              }
            }
            
            return;
          }
        } catch (err) {
          console.log(`Failed to fetch token from ${endpoint}:`, err);
        }
      }
      
      toast.dismiss('fetch-token');
      toast.error('Token not found on any network');
      setManualToken(null);
    } catch (error) {
      console.error('Error fetching token:', error);
      toast.dismiss('fetch-token');
      toast.error('Failed to fetch token info');
      setManualToken(null);
    }
  };

  // Function to create an Associated Token Account for the token
  const createAssociatedTokenAccount = async () => {
    if (!publicKey || !manualToken) return;
    
    setCreatingATA(true);
    try {
      toast.loading('Creating token account...', { id: 'create-ata' });
      
      const mintPubkey = new web3.PublicKey(manualToken.mint);
      
      // Get the ATA address
      const ataAddress = await token.getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );
      
      // Check if it already exists
      const ataInfo = await connection.getAccountInfo(ataAddress);
      
      if (ataInfo) {
        toast.dismiss('create-ata');
        toast.error('Token account already exists');
        return;
      }
      
      // Create a transaction to create the ATA
      const transaction = new web3.Transaction().add(
        token.createAssociatedTokenAccountInstruction(
          publicKey,  // payer
          ataAddress, // associated token account address
          publicKey,  // owner
          mintPubkey  // mint
        )
      );
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.dismiss('create-ata');
      toast.success('Token account created successfully!');
      
      // Refresh token list
      fetchTokens();
      
    } catch (error) {
      console.error('Error creating token account:', error);
      toast.dismiss('create-ata');
      toast.error('Failed to create token account');
    } finally {
      setCreatingATA(false);
    }
  };

  // Function to mint tokens
  const mintTokens = async () => {
    if (!publicKey || !manualToken || !mintAmount) {
      toast.error('Please enter an amount to mint');
      return;
    }
    
    setMintingTokens(true);
    try {
      toast.loading('Minting tokens...', { id: 'mint-tokens' });
      
      const mintPubkey = new web3.PublicKey(manualToken.mint);
      
      // Check if the user is the mint authority
      if (manualToken.mintAuthority !== publicKey.toString()) {
        toast.dismiss('mint-tokens');
        toast.error('You are not the mint authority for this token');
        return;
      }
      
      // Get the ATA address
      const ataAddress = await token.getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );
      
      // Check if ATA exists
      const ataInfo = await connection.getAccountInfo(ataAddress);
      
      const transaction = new web3.Transaction();
      
      // If ATA doesn't exist, create it
      if (!ataInfo) {
        transaction.add(
          token.createAssociatedTokenAccountInstruction(
            publicKey,  // payer
            ataAddress, // associated token account address
            publicKey,  // owner
            mintPubkey  // mint
          )
        );
      }
      
      // Add instruction to mint tokens
      const amountToMint = Number(mintAmount) * Math.pow(10, manualToken.decimals);
      
      transaction.add(
        token.createMintToInstruction(
          mintPubkey,  // mint
          ataAddress,  // destination
          publicKey,   // authority
          BigInt(amountToMint)  // amount with decimals
        )
      );
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.dismiss('mint-tokens');
      toast.success(`Successfully minted ${mintAmount} tokens`);
      
      // Refresh token info and list
      fetchSpecificToken();
      fetchTokens();
      
      // Reset form
      setMintAmount('');
      
    } catch (error) {
      console.error('Error minting tokens:', error);
      toast.dismiss('mint-tokens');
      toast.error('Failed to mint tokens');
    } finally {
      setMintingTokens(false);
    }
  };

  const fetchTokens = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try both mainnet and devnet endpoints
      const endpoints = [
        'https://api.mainnet-beta.solana.com',
        'https://solana-mainnet.g.alchemy.com/v2/demo',
        'https://api.devnet.solana.com',
        'https://devnet.genesysgo.net'
      ];
      
      let allTokens: TokenInfo[] = [];
      
      for (const endpoint of endpoints) {
        try {
          const tokenConnection = new web3.Connection(endpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 30000
          });
          
          console.log(`Trying to fetch tokens from: ${endpoint}`);
          
          const tokenAccounts = await tokenConnection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: token.TOKEN_PROGRAM_ID }
          );
          
          console.log(`Found ${tokenAccounts.value.length} tokens on ${endpoint}`);
          
          // Extract token info
          const tokenList = tokenAccounts.value.map((item) => {
            const accountInfo = item.account.data.parsed.info;
            return {
              mint: accountInfo.mint,
              balance: accountInfo.tokenAmount.uiAmount,
              decimals: accountInfo.tokenAmount.decimals,
              network: endpoint.includes('devnet') ? 'Devnet' : 'Mainnet'
            };
          });
          
          // Filter out tokens with zero balance if you want
          // const nonZeroTokens = tokenList.filter(t => t.balance > 0);
          
          allTokens = [...allTokens, ...tokenList];
        } catch (err) {
          console.log(`Failed to fetch from ${endpoint}:`, err);
        }
      }
      
      // Set all tokens found
      setTokens(allTokens);
      
      if (allTokens.length === 0) {
        console.log('No tokens found in your wallet');
      } else {
        console.log(`Found a total of ${allTokens.length} tokens`);
      }
    } catch (error: any) {
      console.error('Error fetching token accounts:', error);
      setError(`Failed to load tokens: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!publicKey) {
      setTokens([]);
      return;
    }

    fetchTokens();
    
    // Refresh token list every 60 seconds
    const intervalId = setInterval(fetchTokens, 60000);
    
    return () => clearInterval(intervalId);
  }, [publicKey, connection]);

  // Auto-fill the mint address from the transaction you shared
  useEffect(() => {
    setMintAddress('6MdiCBZcWy6m633HzNQYoWyHFZogwXAWZfi8u1ioY4MS');
    // Auto-fetch the token details
    if (publicKey) {
      setTimeout(() => {
        fetchSpecificToken();
      }, 1000);
    }
  }, [publicKey]);

  if (!publicKey) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Your Tokens</h2>
      
      {/* Add manual token lookup section */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Look Up Token</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            placeholder="Enter token mint address"
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={fetchSpecificToken}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Look Up
          </button>
        </div>
        
        {manualToken && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Token Details</h4>
            <p className="text-sm mb-1">
              <span className="font-medium">Mint: </span>
              <span className="font-mono break-all">{manualToken.mint}</span>
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Supply: </span>
              {manualToken.supply.toLocaleString()}
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Decimals: </span>
              {manualToken.decimals}
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Mint Authority: </span>
              <span className="font-mono break-all">{manualToken.mintAuthority}</span>
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Freeze Authority: </span>
              <span className="font-mono break-all">{manualToken.freezeAuthority}</span>
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Network: </span>
              <span className={manualToken.network === 'Devnet' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
                {manualToken.network}
              </span>
            </p>
            
            {/* Add buttons to create ATA and mint tokens */}
            <div className="mt-4 flex flex-col space-y-3">
              <button
                onClick={createAssociatedTokenAccount}
                disabled={creatingATA}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {creatingATA ? 'Creating...' : 'Create Token Account (ATA)'}
              </button>
              
              {/* Only show mint option if user is mint authority */}
              {manualToken.mintAuthority === publicKey?.toString() && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    placeholder="Amount to mint"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={mintTokens}
                    disabled={mintingTokens || !mintAmount}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {mintingTokens ? 'Minting...' : 'Mint Tokens'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Existing token list section */}
      {isLoading ? (
        <div className="text-center py-4">
          <p>Loading tokens...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4 bg-red-100 dark:bg-red-900 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : tokens.length > 0 ? (
        <div className="space-y-4">
          {tokens.map((token, index) => (
            <div key={index} className="token-card p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-medium">Token Mint</p>
                <p className="text-sm font-mono truncate max-w-xs">
                  {token.mint}
                </p>
                <p className="text-xs text-gray-500">Network: {token.network}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{token.balance?.toLocaleString() || '0'}</p>
                <p className="text-xs text-gray-500">Decimals: {token.decimals}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p>No tokens found in your wallet</p>
          <p className="text-sm text-gray-500 mt-2">
            You need to create a token account (ATA) and mint tokens to see them here
          </p>
          <button 
            onClick={() => toast.success('Try creating a token account first!')}
            className="mt-3 text-blue-500 hover:text-blue-700 text-sm"
          >
            Need help?
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenList;