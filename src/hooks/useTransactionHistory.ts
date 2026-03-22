import { useState, useEffect } from 'react';

export interface TransactionInfo {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  explorerUrl: string;
}

const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'stackvault-protocol';

export const useTransactionHistory = (address: string | null) => {
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setTransactions([]);
      return;
    }

    const fetchTxs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const isTestnet = address.startsWith('ST');
        const baseUrl = isTestnet ? 'https://api.testnet.hiro.so' : 'https://api.mainnet.hiro.so';
        
        const res = await fetch(`${baseUrl}/extended/v1/address/${address}/transactions?limit=20`);
        if (!res.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await res.json();
        
        const mappedTxs: TransactionInfo[] = data.results
          .filter((tx: any) => tx.tx_type === 'contract_call')
          .filter((tx: any) => tx.contract_call.contract_id === `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .map((tx: any): TransactionInfo | null => {
            const funcName = tx.contract_call.function_name;
            
            if (funcName !== 'deposit-liquidity' && funcName !== 'withdraw') return null;

            // Arg parsing - basic fallback to 0 if we can't parse
            let rawAmount = 0;
            if (tx.contract_call.function_args && tx.contract_call.function_args.length > 0) {
              const repr = tx.contract_call.function_args[0].repr;
              const match = repr.match(/u(\d+)/);
              if (match) rawAmount = parseInt(match[1]);
            }

            const amountSTX = rawAmount / 1000000;
            
            let status: 'pending' | 'success' | 'failed' = 'failed';
            if (tx.tx_status === 'success') status = 'success';
            if (tx.tx_status === 'pending') status = 'pending';

            return {
              id: tx.tx_id,
              type: funcName === 'deposit-liquidity' ? 'deposit' : 'withdraw',
              amount: amountSTX,
              status,
              timestamp: tx.burn_block_time_iso || new Date().toISOString(),
              explorerUrl: `https://explorer.hiro.so/txid/${tx.tx_id}?chain=${isTestnet ? 'testnet' : 'mainnet'}`,
            };
          })
          .filter(Boolean) as TransactionInfo[];

        setTransactions(mappedTxs);
      } catch (err: any) {
        console.error("Error fetching tx history:", err);
        setError(err.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTxs();
  }, [address]);

  return {
    transactions,
    isLoading,
    error
  };
};
