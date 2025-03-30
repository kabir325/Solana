// src/components/wallet/WalletConnect.tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FC } from 'react';

export const WalletConnect: FC = () => {
  const { connected } = useWallet();
  
  return (
    <div className="flex items-center">
      <WalletMultiButton className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded" />
    </div>
  );
};