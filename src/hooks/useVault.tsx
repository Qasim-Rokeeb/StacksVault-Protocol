import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { openContractCall } from '@stacks/connect';
import { 
  uintCV, 
  PostConditionMode, 
  Pc,
  principalCV,
  fetchCallReadOnlyFunction,
  cvToJSON
} from '@stacks/transactions';
import { userSession, useStacksWallet } from './useStacksWallet';
import { toast } from 'react-hot-toast';

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'stackvault-protocol';

const ERROR_CODES: Record<number, string> = {
  100: 'Not authorized',
  101: 'Insufficient funds in vault',
  102: 'Minimum deposit is 1 STX',
};

export interface VaultContextType {
    depositSTX: (amountSTX: number) => Promise<void>;
    withdrawSTX: (amountSTX: number) => Promise<void>;
    fetchBalance: (address: string) => Promise<number>;
    fetchTotalLiquidity: () => Promise<number>;
    fetchAccruedYield: (address: string) => Promise<number>;
    refreshData: (address?: string, showLoading?: boolean) => Promise<void>;
    status: TransactionStatus;
    txId: string | null;
    userBalance: number;
    totalLiquidity: number;
    accruedYield: number;
    isFetching: boolean;
    resetStatus: () => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider = ({ children }: { children: ReactNode }) => {
    const [status, setStatus] = useState<TransactionStatus>('idle');
    const [txId, setTxId] = useState<string | null>(null);
    const [userBalance, setUserBalance] = useState<number>(0);
    const [totalLiquidity, setTotalLiquidity] = useState<number>(0);
    const [accruedYield, setAccruedYield] = useState<number>(0);
    const [isFetching, setIsFetching] = useState<boolean>(true);

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

    const fetchAccruedYield = useCallback(async (address: string) => {
        try {
            const response = await fetchCallReadOnlyFunction({
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'get-accrued-yield',
                functionArgs: [principalCV(address)],
                senderAddress: address,
            });
            const result = cvToJSON(response);
            const amount = parseInt(result.value.value) / 1000000;
            setAccruedYield(amount);
            return amount;
        } catch (err) {
            console.error('Error fetching accrued yield:', err);
            return 0;
        }
    }, []);

    const refreshData = useCallback(async (address?: string, showLoading: boolean = true) => {
        if (showLoading) setIsFetching(true);
        try {
            const promises: Promise<any>[] = [fetchTotalLiquidity()];
            if (address) {
                promises.push(fetchBalance(address));
                promises.push(fetchAccruedYield(address));
            }
            await Promise.all(promises);
        } finally {
            if (showLoading) setIsFetching(false);
        }
    }, [fetchTotalLiquidity, fetchBalance, fetchAccruedYield]);

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
            toast.error('Please connect your wallet first.');
            return;
        }

        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress?.mainnet || userData.profile.stxAddress?.testnet;
        const amountMicroSTX = Math.floor(amountSTX * 1000000);

        setStatus('pending');

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
                    toast.success('Deposit successful!');
                    // Refresh data after a delay to allow for mempool update
                    setTimeout(() => {
                        refreshData(address, false);
                    }, 4000);
                },
                onCancel: () => {
                    setStatus('idle');
                },
            });
        } catch (err: any) {
            toast.error(mapError(err));
            setStatus('error');
        }
    }, [fetchBalance, fetchTotalLiquidity]);

    const withdrawSTX = useCallback(async (amountSTX: number) => {
        if (!userSession.isUserSignedIn()) {
            toast.error('Please connect your wallet first.');
            return;
        }

        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress?.mainnet || userData.profile.stxAddress?.testnet;
        const amountMicroSTX = Math.floor(amountSTX * 1000000);

        setStatus('pending');

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
                    toast.success('Withdrawal successful!');
                    setTimeout(() => {
                        refreshData(address, false);
                    }, 4000);
                },
                onCancel: () => {
                    setStatus('idle');
                },
            });
        } catch (err: any) {
            toast.error(mapError(err));
            setStatus('error');
        }
    }, [fetchBalance, fetchTotalLiquidity]);

    const { userAddress } = useStacksWallet();

    useEffect(() => {
        refreshData(userAddress || undefined, true);
        const intervalId = setInterval(() => {
            refreshData(userAddress || undefined, false);
        }, 15000);
        return () => clearInterval(intervalId);
    }, [userAddress, refreshData]);

    const value = {
        depositSTX,
        withdrawSTX,
        fetchBalance,
        fetchTotalLiquidity,
        fetchAccruedYield,
        refreshData,
        status,
        txId,
        userBalance,
        totalLiquidity,
        accruedYield,
        isFetching,
        resetStatus: () => setStatus('idle')
    };

    return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};

export const useVault = () => {
    const context = useContext(VaultContext);
    if (!context) throw new Error('useVault must be used within VaultProvider');
    return context;
};
