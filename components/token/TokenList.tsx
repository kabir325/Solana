/**
 * TokenList Component
 * 
 * This component displays a list of SPL tokens owned by the connected wallet.
 * It fetches token accounts and displays their balances.
 */
import { FC, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import { getReliableConnection } from '@/utils/connection';
import toast from 'react-hot-toast'; // Add this import for toast notifications

interface TokenInfo {
  mint: string;
  balance: number;
  decimals: number;
  symbol?: string;
  name?: string;
}

export const TokenList: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setTokens([]);
      return;
    }

    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        const reliableConnection = getReliableConnection(connection.rpcEndpoint);
        
        const tokenAccounts = await reliableConnection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: token.TOKEN_PROGRAM_ID }
        );

        const tokenList: TokenInfo[] = [];

        for (const item of tokenAccounts.value) {
          const accountData = item.account.data.parsed.info;
          const mintAddress = accountData.mint;
          const balance = Number(accountData.tokenAmount.amount) / Math.pow(10, accountData.tokenAmount.decimals);
          
          if (balance > 0) {
            tokenList.push({
              mint: mintAddress,
              balance,
              decimals: accountData.tokenAmount.decimals,
              // We could fetch token metadata here if needed
            });
          }
        }

        setTokens(tokenList);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchTokens, 30000);
    
    return () => clearInterval(intervalId);
  }, [publicKey, connection]);

  if (!publicKey) return null;

  return (
    <div className="bg-[#2E236C]  rounded-lg p-6 border-4 border-[#17153B] text-white">
      <h2 className="text-2xl font-bold mb-4 text-primary">Your Tokens</h2>
      
      {isLoading && tokens.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-2 text-secondary">Loading tokens...</p>
        </div>
      ) : tokens.length > 0 ? (
        <div className="space-y-3">
          {tokens.map((token) => (
            <div 
              key={token.mint} 
              className="p-3 bg-[#17153B] rounded-md hover:bg-[#211a4d] transition-colors duration-200"
            >
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-medium truncate" title={token.mint}>
                    {token.mint.slice(0, 5)}....{token.mint.slice(-4)}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(token.mint);
                      toast.success('Address copied to clipboard');
                    }}
                    className="ml-2 hover:text-[#C8ACD6] text-sm"
                    title="Copy address to clipboard"
                  >
                    Copy
                  </button>
                </div>
                
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">Amount:</p>
                  <p className="text-right break-all">
                    {token.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: token.decimals > 2 ? 4 : token.decimals
                    })}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Decimals:</p>
                  <p>{token.decimals}</p>
                </div>
                
                <div className="mt-1 pt-2 border-t border-[#3d3580]">
                  <a 
                    href={`https://explorer.solana.com/address/${token.mint}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C8ACD6] hover:text-[#62506b] text-sm block text-center"
                  >
                    View on Explorer
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-[#17153B] rounded-md">
          <p className="text-[#F6F8D5]">No tokens found in your wallet</p>
          <p className="text-sm text-[#F6F8D5]/70 mt-2">
            Create or mint tokens to see them here
          </p>
        </div>
      )}
    </div>
  );
};