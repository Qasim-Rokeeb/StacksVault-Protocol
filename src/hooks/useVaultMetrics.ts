import { useState, useCallback, useEffect } from 'react';
import { principalCV, fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'stackvault-protocol';
const NETWORK = STACKS_TESTNET;

export const useVaultMetrics = (userAddress?: string | null) => {
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
                network: NETWORK,
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
                network: NETWORK,
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
                network: NETWORK,
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

    useEffect(() => {
        refreshData(userAddress || undefined, true);
        const intervalId = setInterval(() => {
            refreshData(userAddress || undefined, false);
        }, 15000);
        return () => clearInterval(intervalId);
    }, [userAddress, refreshData]);

    return {
        userBalance,
        totalLiquidity,
        accruedYield,
        isFetching,
        refreshData,
        fetchBalance,
        fetchTotalLiquidity,
        fetchAccruedYield
    };
};
