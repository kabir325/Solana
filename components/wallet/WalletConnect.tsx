// src/components/wallet/WalletConnect.tsx
/**
 * WalletConnect Component
 * 
 * This component renders the wallet connection button using
 * the Solana wallet adapter's WalletMultiButton.
 */
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FC, useEffect, useState } from 'react';

export const WalletConnect: FC = () => {
  const { connected } = useWallet();
  // Add this state to prevent server/client mismatch
  const [mounted, setMounted] = useState(false);

  // Only show the component after it's mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return <div className="wallet-adapter-button wallet-adapter-button-trigger" style={{ height: '36px', padding: '0 24px' }}></div>;
  }

  return (
    <div className="flex items-center">
      <WalletMultiButton className="bg-accent hover:bg-accent-dark text-white" />
    </div>
  );
};