import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import type {
    ReactNode
} from "react";

import {
    BrowserProvider,
    JsonRpcSigner
} from "ethers";

import type { Chain } from "../config/chain";

declare global {
    interface Window {
        ethereum?: any;
    }
}

type WalletContextType = {
    provider: BrowserProvider | null;
    signer: JsonRpcSigner | null;
    address: string;
    balance: string;
    chainId: number;
    connected: boolean;

    connect: () => Promise<void>;
    disconnect: () => void;
    refresh: () => Promise<void>;

    switchChain: (chain: Chain) => Promise<void>;
};

const WalletContext =
    createContext<WalletContextType | null>(null);

export function WalletProvider({
    children
}: {
    children: ReactNode;
}) {

    const [provider, setProvider] =
        useState<BrowserProvider | null>(null);

    const [signer, setSigner] =
        useState<JsonRpcSigner | null>(null);

    const [address, setAddress] =
        useState("");

    const [balance, setBalance] =
        useState("");

    const [chainId, setChainId] =
        useState(0);

    // =====================================================
    // REFRESH
    // =====================================================

    async function refresh() {

        if (!window.ethereum) {
            return;
        }

        try {

            const browserProvider =
                new BrowserProvider(window.ethereum);

            const accounts =
                await browserProvider.send(
                    "eth_accounts",
                    []
                );

            if (
                !accounts ||
                accounts.length === 0
            ) {

                disconnect();

                return;
            }

            const walletSigner =
                await browserProvider.getSigner();

            const walletAddress =
                await walletSigner.getAddress();

            const network =
                await browserProvider.getNetwork();

            const balanceWei =
                await browserProvider.getBalance(
                    walletAddress
                );

            setProvider(
                browserProvider
            );

            setSigner(
                walletSigner
            );

            setAddress(
                walletAddress
            );

            setChainId(
                Number(network.chainId)
            );

            setBalance(
                ethers.formatEther(
                    balanceWei
                )
            );

        } catch (error) {

            console.error(
                "Wallet refresh error:",
                error
            );

        }

    }

    // =====================================================
    // CONNECT
    // =====================================================

    async function connect() {

        if (!window.ethereum) {

            alert(
                "MetaMask not found"
            );

            return;
        }

        try {

            await window.ethereum.request({
                method:
                    "eth_requestAccounts"
            });

            await refresh();

        } catch (error) {

            console.error(
                "Wallet connect error:",
                error
            );

        }

    }

    // =====================================================
    // SWITCH CHAIN
    // =====================================================

    async function switchChain(
        chain: Chain
    ) {

        if (!window.ethereum) {

            alert(
                "MetaMask not found"
            );

            return;
        }

        if (
            !chain ||
            !chain.chainId
        ) {

            console.error(
                "Invalid chain:",
                chain
            );

            return;
        }

        try {

            const targetChainId =
                "0x" +
                chain.chainId.toString(16);

            // =================================================
            // CEK CHAIN SEKARANG
            // =================================================

            const currentChainId =
                await window.ethereum.request({
                    method:
                        "eth_chainId"
                });

            // Sudah di chain tersebut
            if (
                currentChainId.toLowerCase() ===
                targetChainId.toLowerCase()
            ) {

                await refresh();

                return;
            }

            // =================================================
            // SWITCH CHAIN
            // =================================================

            try {

                await window.ethereum.request({

                    method:
                        "wallet_switchEthereumChain",

                    params: [
                        {
                            chainId:
                                targetChainId
                        }
                    ]

                });

            } catch (switchError: any) {

                console.error(
                    "wallet_switchEthereumChain:",
                    switchError
                );

                // =================================================
                // NETWORK BELUM ADA
                // =================================================

                if (
                    switchError?.code === 4902 ||
                    switchError?.code === -32603
                ) {

                    await window.ethereum.request({

                        method:
                            "wallet_addEthereumChain",

                        params: [
                            {
                                chainId:
                                    targetChainId,

                                chainName:
                                    chain.chainName,

                                nativeCurrency: {
                                    name:
                                        chain.nativeSymbol,

                                    symbol:
                                        chain.nativeSymbol,

                                    decimals:
                                        18
                                },

                                rpcUrls: [
                                    chain.rpcUrl
                                ],

                                ...(chain.explorer
                                    ? {
                                        blockExplorerUrls: [
                                            chain.explorer
                                        ]
                                    }
                                    : {})
                            }
                        ]

                    });

                    // =================================================
                    // SETELAH ADD → SWITCH LAGI
                    // =================================================

                    await window.ethereum.request({

                        method:
                            "wallet_switchEthereumChain",

                        params: [
                            {
                                chainId:
                                    targetChainId
                            }
                        ]

                    });

                } else {

                    throw switchError;

                }

            }

            // =================================================
            // REFRESH DEX
            // =================================================

            await refresh();

        } catch (error) {

            console.error(
                "Switch chain error:",
                error
            );

            throw error;
        }

    }

    // =====================================================
    // DISCONNECT
    // =====================================================

    function disconnect() {

        setProvider(null);

        setSigner(null);

        setAddress("");

        setBalance("");

        setChainId(0);

    }

    // =====================================================
    // METAMASK EVENTS
    // =====================================================

    useEffect(() => {

        refresh();

        if (!window.ethereum) {
            return;
        }

        const accountChanged =
            () => {
                refresh();
            };

        const chainChanged =
            () => {
                refresh();
            };

        window.ethereum.on(
            "accountsChanged",
            accountChanged
        );

        window.ethereum.on(
            "chainChanged",
            chainChanged
        );

        return () => {

            window.ethereum.removeListener(
                "accountsChanged",
                accountChanged
            );

            window.ethereum.removeListener(
                "chainChanged",
                chainChanged
            );

        };

    }, []);

    // =====================================================
    // PROVIDER
    // =====================================================

    return (

        <WalletContext.Provider
            value={{

                provider,

                signer,

                address,

                balance,

                chainId,

                connected:
                    !!signer,

                connect,

                disconnect,

                refresh,

                switchChain

            }}
        >

            {children}

        </WalletContext.Provider>

    );

}

// =========================================================
// HOOK
// =========================================================

export function useWallet() {

    const context =
        useContext(
            WalletContext
        );

    if (!context) {

        throw new Error(
            "WalletProvider missing"
        );

    }

    return context;

}