import { useState, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { openContractCall } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import { 
  uintCV, 
  PostConditionMode, 
  Pc
} from '@stacks/transactions';
import { userSession, useStacksWallet } from './useStacksWallet';
import { toast } from 'react-hot-toast';
import { useVaultMetrics } from './useVaultMetrics';

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'stackvault-protocol';

const ERROR_CODES: Record<number, string> = {
  100: 'Not authorized',
  101: 'Insufficient funds in vault',
  102: 'Minimum deposit is 1 STX',
};

const NETWORK = STACKS_TESTNET;

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
    const { userAddress } = useStacksWallet();
    const { 
        userBalance, 
        totalLiquidity, 
        accruedYield, 
        isFetching, 
        refreshData, 
        fetchBalance, 
        fetchTotalLiquidity, 
        fetchAccruedYield 
    } = useVaultMetrics(userAddress);

    const [status, setStatus] = useState<TransactionStatus>('idle');
    const [txId, setTxId] = useState<string | null>(null);

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
                network: NETWORK,
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
    }, [refreshData]);

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
                network: NETWORK,
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
    }, [refreshData]);



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
