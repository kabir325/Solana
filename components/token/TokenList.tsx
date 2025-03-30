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
}

export const TokenList: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setTokens([]);
      return;
    }

    const fetchTokens = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use devnet endpoints which are more reliable for testing
        const endpoints = [
          'https://api.devnet.solana.com',
          'https://devnet.genesysgo.net',
          'https://devnet.solana.com'
        ];
        
        let tokenAccounts = null;
        let error = null;
        
        // Try each endpoint until one works
        for (const endpoint of endpoints) {
          try {
            const tokenConnection = new web3.Connection(endpoint, {
              commitment: 'confirmed',
              confirmTransactionInitialTimeout: 60000, // 60 seconds timeout
              disableRetryOnRateLimit: false
            });
            
            console.log(`Trying to fetch tokens using endpoint: ${endpoint}`);
            
            // Get all token accounts for the connected wallet
            tokenAccounts = await tokenConnection.getParsedTokenAccountsByOwner(
              publicKey,
              { programId: token.TOKEN_PROGRAM_ID }
            );
            
            // If we get here, the request succeeded
            console.log(`Successfully fetched tokens from ${endpoint}`);
            break;
          } catch (err) {
            error = err;
            console.log(`Failed to fetch tokens from ${endpoint}:`, err);
            // Continue to the next endpoint
          }
        }
        
        if (tokenAccounts) {
          console.log('Token accounts response received');

          // Extract token info from accounts
          const tokenList = tokenAccounts.value.map((item) => {
            const accountInfo = item.account.data.parsed.info;
            const mintAddress = accountInfo.mint;
            const balance = accountInfo.tokenAmount.uiAmount;
            const decimals = accountInfo.tokenAmount.decimals;

            return {
              mint: mintAddress,
              balance,
              decimals,
            };
          });

          // Show all tokens, even with zero balance
          setTokens(tokenList);
          
          if (tokenList.length === 0) {
            console.log('No tokens found for this wallet');
          } else {
            console.log(`Found ${tokenList.length} token accounts`);
          }
        } else if (error) {
          console.error('All token fetch attempts failed:', error);
          setError('Failed to load token accounts. Please try again later.');
        }
      } catch (error: any) {
        console.error('Error fetching token accounts:', error);
        
        // More detailed error message
        const errorMessage = error.message || 'Unknown error';
        setError(`Failed to load token accounts: ${errorMessage}`);
        
        // Show toast with more specific error
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message?.includes('403')) {
          toast.error('Access forbidden. Try using a different wallet or network.');
        } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
          toast.error('Connection timed out. Network may be congested.');
        } else {
          toast.error('Failed to load tokens. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
    // Refresh token list every 60 seconds instead of 30 to avoid rate limiting
    const intervalId = setInterval(fetchTokens, 60000);
    
    return () => clearInterval(intervalId);
  }, [publicKey, connection]);

  if (!publicKey) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Your Tokens</h2>
      
      {isLoading ? (
        <div className="text-center py-4">
          <p>Loading tokens...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4 bg-red-100 dark:bg-red-900 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Try switching to Devnet in your wallet settings
          </p>
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
            Create or receive tokens to see them here
          </p>
          <button 
            onClick={() => toast.success('Try creating a token first!')}
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