import { useState, useEffect } from 'react';

export interface TransactionInfo {
  id: string;
  txId: string;
  blockHeight: number;
  eventIndex: number;
  source: 'indexed_event' | 'contract_call_fallback';
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
        const contractId = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
        const contractPrincipal = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
        
        const res = await fetch(`${baseUrl}/extended/v1/address/${address}/transactions?limit=30`);
        if (!res.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await res.json();

        const contractCalls = (data.results || [])
          .filter((tx: any) => tx.tx_type === 'contract_call')
          .filter((tx: any) => tx.contract_call?.contract_id === contractId)
          .filter((tx: any) => {
            const funcName = tx.contract_call?.function_name;
            return funcName === 'deposit-liquidity' || funcName === 'withdraw';
          });

        const txEvents = await Promise.all(
          contractCalls.map(async (tx: any) => {
            const eventsRes = await fetch(`${baseUrl}/extended/v1/tx/${tx.tx_id}/events?limit=50`);

            if (!eventsRes.ok) {
              return { tx, events: [] as any[] };
            }

            const eventsData = await eventsRes.json();
            return { tx, events: eventsData.results || [] };
          })
        );

        const mappedTxs: TransactionInfo[] = txEvents.flatMap(({ tx, events }) => {
          const funcName = tx.contract_call?.function_name;
          const eventType: 'deposit' | 'withdraw' = funcName === 'deposit-liquidity' ? 'deposit' : 'withdraw';

          let status: 'pending' | 'success' | 'failed' = 'failed';
          if (tx.tx_status === 'success') status = 'success';
          if (tx.tx_status === 'pending') status = 'pending';

          const timestamp = tx.burn_block_time_iso || new Date().toISOString();
          const explorerUrl = `https://explorer.hiro.so/txid/${tx.tx_id}?chain=${isTestnet ? 'testnet' : 'mainnet'}`;
          const blockHeight = Number(tx.block_height || 0);

          const indexedTransferEvents = events
            .map((evt: any) => ({
              eventIndex: Number(evt.event_index ?? -1),
              transfer: evt.stx_transfer_event || null,
            }))
            .filter((evt: any) => !!evt.transfer)
            .filter((evt: any) => {
              const sender = evt.transfer.sender;
              const recipient = evt.transfer.recipient;

              if (eventType === 'deposit') {
                return sender === address && recipient === contractPrincipal;
              }

              return sender === contractPrincipal && recipient === address;
            })
            .map((evt: any): TransactionInfo => {
              const amountMicro = Number(evt.transfer.amount || 0);

              return {
                id: `${tx.tx_id}:${evt.eventIndex}`,
                txId: tx.tx_id,
                blockHeight,
                eventIndex: evt.eventIndex,
                source: 'indexed_event',
                type: eventType,
                amount: amountMicro / 1000000,
                status,
                timestamp,
                explorerUrl,
              };
            });

          if (indexedTransferEvents.length > 0) {
            return indexedTransferEvents;
          }

          // If no indexed transfer event is available yet (e.g. pending tx), fallback to parsed arg amount.
          let rawAmount = 0;
          if (tx.contract_call?.function_args && tx.contract_call.function_args.length > 0) {
            const repr = tx.contract_call.function_args[0].repr;
            const match = repr.match(/u(\d+)/);
            if (match) rawAmount = parseInt(match[1], 10);
          }

          return [{
            id: `${tx.tx_id}:call`,
            txId: tx.tx_id,
            blockHeight,
            eventIndex: -1,
            source: 'contract_call_fallback',
            type: eventType,
            amount: rawAmount / 1000000,
            status,
            timestamp,
            explorerUrl,
          }];
        });

        mappedTxs.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        });

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
