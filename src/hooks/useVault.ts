import { useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import { 
  uintCV, 
  PostConditionMode, 
  Pc,
  principalCV,
  fetchCallReadOnlyFunction,
  cvToJSON
} from '@stacks/transactions';
import { userSession } from './useStacksWallet';

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'stackvault-protocol';

const ERROR_CODES: Record<number, string> = {
  100: 'Not authorized',
  101: 'Insufficient funds in vault',
  102: 'Minimum deposit is 1 STX',
};

export const useVault = () => {
    const [status, setStatus] = useState<TransactionStatus>('idle');
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userBalance, setUserBalance] = useState<number>(0);
    const [totalLiquidity, setTotalLiquidity] = useState<number>(0);

    const fetchBalance = useCallback(async (address: string) => {
        try {
            const response = await fetchCallReadOnlyFunction({
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'get-balance',
                functionArgs: [principalCV(address)],
                senderAddress: address,
            });
            const result = cvToJSON(response);
            const amount = parseInt(result.value.value) / 1000000;
            setUserBalance(amount);
            return amount;
        } catch (err) {
            console.error('Error fetching balance:', err);
            return 0;
        }
    }, []);

    const fetchTotalLiquidity = useCallback(async () => {
        try {
            const response = await fetchCallReadOnlyFunction({
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'get-total-liquidity',
                functionArgs: [],
                senderAddress: CONTRACT_ADDRESS,
            });
            const result = cvToJSON(response);
            const amount = parseInt(result.value.value) / 1000000;
            setTotalLiquidity(amount);
            return amount;
        } catch (err) {
            console.error('Error fetching total liquidity:', err);
            return 0;
        }
    }, []);

    const mapError = (err: any): string => {
        const message = err.message || '';
        const match = message.match(/error u(\d+)/);
        if (match) {
            const code = parseInt(match[1]);
            return ERROR_CODES[code] || `Contract error: ${code}`;
        }
        return message || 'An unexpected error occurred';
    };

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
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'deposit-liquidity',
                functionArgs: [uintCV(amountMicroSTX)],
                postConditionMode: PostConditionMode.Deny,
                postConditions: [
                    Pc.principal(address).willSendEq(amountMicroSTX).ustx()
                ],
                onFinish: (data) => {
                    setTxId(data.txId);
                    setStatus('success');
                    // Refresh data after a delay to allow for mempool update
                    setTimeout(() => {
                        fetchBalance(address);
                        fetchTotalLiquidity();
                    }, 4000);
                },
                onCancel: () => {
                    setStatus('idle');
                },
            });
        } catch (err: any) {
            setError(mapError(err));
            setStatus('error');
        }
    }, [fetchBalance, fetchTotalLiquidity]);

    const withdrawSTX = useCallback(async (amountSTX: number) => {
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
                contractAddress: CONTRACT_ADDRESS, 
                contractName: CONTRACT_NAME,
                functionName: 'withdraw',
                functionArgs: [uintCV(amountMicroSTX)],
                postConditionMode: PostConditionMode.Allow,
                onFinish: (data) => {
                    setTxId(data.txId);
                    setStatus('success');
                    setTimeout(() => {
                        fetchBalance(address);
                        fetchTotalLiquidity();
                    }, 4000);
                },
                onCancel: () => {
                    setStatus('idle');
                },
            });
        } catch (err: any) {
            setError(mapError(err));
            setStatus('error');
        }
    }, [fetchBalance, fetchTotalLiquidity]);

    return {
        depositSTX,
        withdrawSTX,
        fetchBalance,
        fetchTotalLiquidity,
        status,
        txId,
        error,
        userBalance,
        totalLiquidity,
        resetStatus: () => setStatus('idle')
    };
};
