import "./ChainWalletSelector.css";
import { useMemo, useState } from "react";

import type { Chain } from "../../config/chain";
import { CHAINS } from "../../config/chain";
import { useWallet } from "../../context/WalletContext";

import WalletModal from "../WalletModal/WalletModal";

export default function ChainWalletSelector() {
    const {
        connected,
        address,
        chainId,
        connect,
        disconnect,
        switchChain
    } = useWallet();

    const [chainOpen, setChainOpen] = useState(false);
    const [walletOpen, setWalletOpen] = useState(false);

    const currentChain = useMemo(() => {
        return (
            CHAINS.find(
                (chain) => chain.chainId === chainId
            ) || CHAINS[0]
        );
    }, [chainId]);

    const shortAddress = useMemo(() => {
        if (!address) {
            return "Connect Wallet";
        }

        return (
            address.slice(0, 6) +
            "..." +
            address.slice(-4)
        );
    }, [address]);

    async function handleChainSelect(chain: Chain) {
        try {
            setWalletOpen(false);

            if (chain.chainId === chainId) {
                setChainOpen(false);
                return;
            }

            await switchChain(chain);

            setChainOpen(false);
        } catch (error) {
            console.error(
                "Chain selection failed:",
                error
            );
        }
    }

    async function handleWalletConnect() {
        try {
            await connect();

            setWalletOpen(false);
        } catch (error) {
            console.error(
                "Wallet connection failed:",
                error
            );
        }
    }

    function handleWalletClick() {
        if (!connected) {
            setChainOpen(false);
            setWalletOpen(true);
            return;
        }

        setChainOpen(false);

        setWalletOpen(
            (value) => !value
        );
    }

    function handleDisconnect() {
        setWalletOpen(false);
        disconnect();
    }

    return (
        <div className="chainWalletSelector">

            {/* =================================================
                CHAIN SELECTOR
            ================================================= */}

            <div className="selectorBlock">

                <button
                    type="button"
                    className="chainSelectorButton"
                    onClick={() => {
                        setWalletOpen(false);

                        setChainOpen(
                            (value) => !value
                        );
                    }}
                >

                    <span className="chainDot">
                        ●
                    </span>

                    <span className="chainName">
                        {
                            currentChain?.chainName ??
                            "Unknown"
                        }
                    </span>

                    <span className="selectorArrow">
                        ▼
                    </span>

                </button>

                {chainOpen && (
                    <div className="chainDropdown">

                        <div className="dropdownTitle">
                            Select Chain
                        </div>

                        {CHAINS.map(
                            (chain) => {

                                const selected =
                                    chain.chainId ===
                                    chainId;

                                return (
                                    <button
                                        type="button"
                                        key={chain.key}
                                        className={
                                            "chainOption" +
                                            (
                                                selected
                                                    ? " selected"
                                                    : ""
                                            )
                                        }
                                        onClick={() =>
                                            handleChainSelect(
                                                chain
                                            )
                                        }
                                    >

                                        <span className="chainOptionDot">
                                            ●
                                        </span>

                                        <span className="chainOptionName">
                                            {
                                                chain.chainName
                                            }
                                        </span>

                                        {selected && (
                                            <span className="chainCheck">
                                                ✓
                                            </span>
                                        )}

                                    </button>
                                );
                            }
                        )}

                    </div>
                )}

            </div>

            <div className="selectorPlus">
                +
            </div>

            {/* =================================================
                WALLET
            ================================================= */}

            <div className="selectorBlock">

                <button
                    type="button"
                    className="walletSelectorButton"
                    onClick={
                        handleWalletClick
                    }
                >

                    <span className="walletAddress">
                        {
                            shortAddress
                        }
                    </span>

                    <span className="selectorArrow">
                        ▼
                    </span>

                </button>

                {/* =================================================
                    CONNECT WALLET MODAL
                ================================================= */}

                {!connected && walletOpen && (
                    <WalletModal
                        onClose={() =>
                            setWalletOpen(false)
                        }
                        onConnect={
                            handleWalletConnect
                        }
                    />
                )}

                {/* =================================================
                    CONNECTED WALLET DROPDOWN
                ================================================= */}

                {walletOpen &&
                    connected && (
                        <div className="walletDropdown">

                            <div className="walletDropdownTitle">
                                Connected Wallet
                            </div>

                            <div className="walletDropdownAddress">
                                {address}
                            </div>

                            <div className="walletDropdownChain">

                                <span className="chainOptionDot">
                                    ●
                                </span>

                                <span>
                                    {
                                        currentChain?.chainName
                                    }
                                </span>

                            </div>

                            <button
                                type="button"
                                className="disconnectButton"
                                onClick={
                                    handleDisconnect
                                }
                            >
                                Disconnect
                            </button>

                        </div>
                    )}

            </div>

        </div>
    );
}