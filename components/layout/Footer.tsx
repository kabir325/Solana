// src/components/layout/Footer.tsx
/**
 * Footer Component
 * 
 * This component displays the application footer with links and information.
 */
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-neutral py-6">
      <div className=" px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-neutral">Solana Token App</p>
            <p className="text-xs text-neutral-light mt-1">
              Built with Next.js and Solana Web3.js
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a 
              href="https://solana.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral hover:text-white transition-colors duration-200"
            >
              Solana
            </a>
            <a 
              href="https://spl.solana.com/token" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral hover:text-white transition-colors duration-200"
            >
              SPL Token
            </a>
            <a 
              href="https://explorer.solana.com/?cluster=devnet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral hover:text-white transition-colors duration-200"
            >
              Explorer
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-neutral/20 text-center text-xs text-neutral-light">
          <p>This app interacts with the Solana devnet. Do not use real funds.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;