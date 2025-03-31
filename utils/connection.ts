/**
 * Connection Utilities
 * 
 * This file provides utility functions for creating reliable
 * connections to the Solana blockchain and handling retries.
 */
import { Connection } from '@solana/web3.js';

const connectionCache: Record<string, Connection> = {};

/**
 * Get a reliable connection with proper configuration
 * @param endpoint The RPC endpoint URL
 * @returns A configured Connection instance
 */
export function getReliableConnection(endpoint: string): Connection {
  if (connectionCache[endpoint]) {
    return connectionCache[endpoint];
  }
  
  const connection = new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
  });
  
  connectionCache[endpoint] = connection;
  return connection;
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with exponential backoff retry
 * @param fn The function to execute
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}