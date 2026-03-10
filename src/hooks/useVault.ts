import { useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import { 
  uintCV, 
  PostConditionMode, 
  Pc
} from '@stacks/transactions';
import { userSession } from './useStacksWallet';

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

export const useVault = () => {
    const [status, setStatus] = useState<TransactionStatus>('idle');
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const depositSTX = useCallback(async (amountSTX: number) => {
        if (!userSession.isUserSignedIn()) {
            setError('Please connect your wallet first.');
            return;
        }

        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress?.mainnet || userData.profile.stxAddress?.testnet;
        const amountMicroSTX = Math.floor(amountSTX * 1000000);

        setStatus('pending');
        setError(null);

        try {
            await openContractCall({
                contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Local/Devnet default
                contractName: 'stackvault-protocol',
                functionName: 'deposit-liquidity',
                functionArgs: [uintCV(amountMicroSTX)],
                postConditionMode: PostConditionMode.Deny,
                postConditions: [
                    Pc.principal(address).willSendEq(amountMicroSTX).ustx()
                ],
                onFinish: (data) => {
                    console.log('Transaction finished:', data);
                    setTxId(data.txId);
                    setStatus('success');
                },
                onCancel: () => {
                    console.log('Transaction cancelled');
                    setStatus('idle');
                },
            });
        } catch (err: any) {
            console.error('Transaction error:', err);
            setError(err.message || 'An unexpected error occurred');
            setStatus('error');
        }
    }, []);

    const withdrawSTX = useCallback(async (amountSTX: number) => {
        if (!userSession.isUserSignedIn()) {
            setError('Please connect your wallet first.');
            return;
        }

        const amountMicroSTX = Math.floor(amountSTX * 1000000);

        setStatus('pending');
        setError(null);

        try {
            await openContractCall({
                contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 
                contractName: 'stackvault-protocol',
                functionName: 'withdraw',
                functionArgs: [uintCV(amountMicroSTX)],
                postConditionMode: PostConditionMode.Allow, // Contract transfers to user
                onFinish: (data) => {
                    setTxId(data.txId);
                    setStatus('success');
                },
                onCancel: () => {
                    setStatus('idle');
                },
            });
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setStatus('error');
        }
    }, []);

    return {
        depositSTX,
        withdrawSTX,
        status,
        txId,
        error,
        resetStatus: () => setStatus('idle')
    };
};
