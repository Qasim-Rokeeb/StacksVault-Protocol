import { useState, useEffect, useCallback } from 'react';
import { AppConfig, UserSession, showConnect, UserData } from '@stacks/connect';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export interface StacksWalletState {
    userData: UserData | null;
    userAddress: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
}

export const useStacksWallet = () => {
    const [state, setState] = useState<StacksWalletState>({
        userData: null,
        userAddress: null,
        isConnected: false,
        isConnecting: false,
        error: null,
    });

    const updateState = useCallback((userData: UserData | null) => {
        if (userData) {
            const address = userData.profile.stxAddress?.mainnet || userData.profile.stxAddress?.testnet || null;
            setState({
                userData,
                userAddress: address,
                isConnected: true,
                isConnecting: false,
                error: null,
            });
        } else {
            setState({
                userData: null,
                userAddress: null,
                isConnected: false,
                isConnecting: false,
                error: null,
            });
        }
    }, []);

    useEffect(() => {
        if (userSession.isSignInPending()) {
            setState(s => ({ ...s, isConnecting: true }));
            userSession.handlePendingSignIn().then((userData) => {
                updateState(userData);
            }).catch((err) => {
                setState(s => ({ ...s, isConnecting: false, error: err.message }));
            });
        } else if (userSession.isUserSignedIn()) {
            updateState(userSession.loadUserData());
        }
    }, [updateState]);

    const handleConnect = useCallback(() => {
        setState(s => ({ ...s, isConnecting: true, error: null }));
        showConnect({
            appDetails: {
                name: 'StackVault',
                icon: window.location.origin + '/vite.svg',
            },
            redirectTo: '/',
            onFinish: () => {
                const userData = userSession.loadUserData();
                updateState(userData);
            },
            onCancel: () => {
                setState(s => ({ ...s, isConnecting: false }));
            },
            userSession,
        });
    }, [updateState]);

    const handleDisconnect = useCallback(() => {
        userSession.signUserOut();
        updateState(null);
    }, [updateState]);

    return {
        ...state,
        handleConnect,
        handleDisconnect,
    };
};
