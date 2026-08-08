import "./ChainWalletSelector.css";

import { useMemo, useState } from "react";

import type { Chain } from "../../config/chain";
import { CHAINS } from "../../config/chain";
import { useWallet } from "../../context/WalletContext";

export default function ChainWalletSelector() {

    const {
        connected,
        address,
        chainId,
        connect,
        disconnect,
        switchChain
    } = useWallet();

    const [chainOpen, setChainOpen] =
        useState(false);

    const [walletOpen, setWalletOpen] =
        useState(false);

    // =========================================================
    // CURRENT CHAIN
    // =========================================================

    const currentChain = useMemo(() => {

        return (
            CHAINS.find(
                (chain) =>
                    chain.chainId === chainId
            ) || CHAINS[0]
        );

    }, [chainId]);

    // =========================================================
    // SHORT ADDRESS
    // =========================================================

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

    // =========================================================
    // SELECT CHAIN
    // =========================================================

    async function handleChainSelect(
        chain: Chain
    ) {

        try {

            // Tutup wallet dropdown
            setWalletOpen(false);

            // Kalau chain yang dipilih
            // sama dengan chain sekarang
            if (
                chain.chainId === chainId
            ) {

                setChainOpen(false);

                return;
            }

            // Jalankan switch melalui WalletContext
            //
            // Ini yang akan memunculkan popup
            // MetaMask.
            await switchChain(chain);

            // Tutup dropdown setelah selesai
            setChainOpen(false);

        } catch (error) {

            console.error(
                "Chain selection failed:",
                error
            );

        }

    }

    // =========================================================
    // WALLET BUTTON
    // =========================================================

    async function handleWalletClick() {

        // Kalau belum connect
        if (!connected) {

            try {

                await connect();

            } catch (error) {

                console.error(
                    "Wallet connection failed:",
                    error
                );

            }

            return;
        }

        // Kalau sudah connect,
        // buka/tutup dropdown wallet
        setChainOpen(false);

        setWalletOpen(
            (value) => !value
        );

    }

    // =========================================================
    // DISCONNECT
    // =========================================================

    function handleDisconnect() {

        setWalletOpen(false);

        disconnect();

    }

    // =========================================================
    // RENDER
    // =========================================================

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
                        🟢
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


                {/* =================================================
                    CHAIN DROPDOWN
                ================================================= */}

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
                                        key={
                                            chain.key
                                        }
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
                                            🟢
                                        </span>

                                        <span className="chainOptionName">
                                            {
                                                chain.chainName
                                            }
                                        </span>

                                        {
                                            selected && (
                                                <span className="chainCheck">
                                                    ✓
                                                </span>
                                            )
                                        }

                                    </button>

                                );

                            }
                        )}

                    </div>

                )}

            </div>


            {/* =================================================
                PLUS
            ================================================= */}

            <div className="selectorPlus">
                +
            </div>


            {/* =================================================
                WALLET SELECTOR
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
                    WALLET DROPDOWN
                ================================================= */}

                {
                    walletOpen &&
                    connected && (

                        <div className="walletDropdown">

                            <div className="walletDropdownAddress">

                                {
                                    address
                                }

                            </div>


                            <div className="walletDropdownChain">

                                🟢

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

                    )
                }

            </div>

        </div>

    );

}