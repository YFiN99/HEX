import "./SwapCard.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, Settings } from "lucide-react";

import TokenInput from "../TokenInput/TokenInput";
import SwapButton from "../SwapButton/SwapButton";
import TokenModal from "../TokenModal/TokenModal";
import SettingsModal from "../SettingsModal/SettingsModal";
import Toast from "../Toast/Toast";

import { useSwap } from "../../hooks/useSwap";
import { useWallet } from "../../context/WalletContext";
import { CHAINS } from "../../config/chain";

export default function SwapCard() {

    const { chainId } = useWallet();

    // Tidak fallback ke CHAINS[0]. Kalau user belum connect/pilih chain,
    // chainId = 0 dan chain akan bernilai undefined -> UI di-disable
    // dan menampilkan pesan "Pilih network dulu" (lihat noChainSelected).
    const chain = useMemo(() => {
        return CHAINS.find(c => c.chainId === chainId);
    }, [chainId]);

    const noChainSelected = !chain;

    const {
        payToken,
        receiveToken,
        setPayToken,
        setReceiveToken,
        payAmount,
        receiveAmount,
        setPayAmount,
        setReceiveAmount,
        payBalance,
        receiveBalance,
        price,
        priceImpact,
        minimumReceived,
        executeSwap,
        loading
    } = useSwap();

    const [modalOpen, setModalOpen] = useState(false);
    const [settingOpen, setSettingOpen] = useState(false);
    const [selectingPay, setSelectingPay] = useState(true);

    // =====================================================
    // VALIDASI TOKEN TERHADAP CHAIN AKTIF (MENCEGAH TOKEN NYANGKUT)
    // =====================================================

    // Melacak chain sebelumnya. Beberapa chain punya token dengan simbol
    // yang sama (mis. "ETH" bisa jadi token native di satu chain, tapi
    // token wrapped di chain lain) — jadi validasi berdasarkan simbol saja
    // tidak cukup untuk mendeteksi pergantian chain.
    const lastChainKeyRef = useRef<string | null>(null);

    useEffect(() => {
        if (!chain || !chain.tokens || chain.tokens.length === 0) return;

        const chainChanged = lastChainKeyRef.current !== chain.key;
        lastChainKeyRef.current = chain.key;

        // Cek apakah payToken dan receiveToken ada di dalam daftar token chain saat ini
        const isPayValid = chain.tokens.some(t => t.symbol === payToken);
        const isReceiveValid = chain.tokens.some(t => t.symbol === receiveToken);

        // Reset ke token default chain ini jika: chain baru saja berganti,
        // atau salah satu token tidak valid, atau kosong
        if (chainChanged || !isPayValid || !isReceiveValid || payToken === receiveToken) {
            if (chain.tokens.length >= 2) {
                // Pay default: token native chain ini (fallback ke token pertama)
                const nativeToken =
                    chain.tokens.find(t => t.address === "native") ||
                    chain.tokens[0];

                // Receive default, urutan prioritas:
                // 1. BTC (bukan native, bukan wrapped)
                // 2. Token lain apa pun yang bukan native & bukan wrapped
                // 3. (last resort) token wrapped, jika memang tidak ada pilihan lain
                const btcToken =
                    chain.tokens.find(
                        t =>
                            t.symbol === "BTC" &&
                            t.symbol !== nativeToken.symbol &&
                            !t.isWrappedNative
                    );

                const nonWrappedToken =
                    chain.tokens.find(
                        t =>
                            t.symbol !== nativeToken.symbol &&
                            !t.isWrappedNative
                    );

                const anyOtherToken =
                    chain.tokens.find(
                        t => t.symbol !== nativeToken.symbol
                    );

                const receiveDefault =
                    btcToken || nonWrappedToken || anyOtherToken;

                setPayToken(nativeToken.symbol);
                setReceiveToken((receiveDefault || chain.tokens[1]).symbol);
            } else if (chain.tokens.length === 1) {
                setPayToken(chain.tokens[0].symbol);
                setReceiveToken(chain.tokens[0].symbol);
            }
        }
    }, [chainId, chain, payToken, receiveToken, setPayToken, setReceiveToken]);

    //=====================================================
    // TOAST STATE & TIMER (7 SECONDS)
    //=====================================================
    const [toastOpen, setToastOpen] = useState(false);
    const [txHash, setTxHash] = useState("");

    useEffect(() => {
        if (!toastOpen) return;
        const timer = setTimeout(() => {
            setToastOpen(false);
        }, 7000);
        return () => clearTimeout(timer);
    }, [toastOpen]);

    //----------------------------------------------------
    // OPEN MODAL
    //----------------------------------------------------

    function openPay() {
        if (noChainSelected) return;
        setSelectingPay(true);
        setModalOpen(true);
    }

    function openReceive() {
        if (noChainSelected) return;
        setSelectingPay(false);
        setModalOpen(true);
    }

    //----------------------------------------------------
    // SELECT TOKEN
    //----------------------------------------------------

    function handleSelect(token: string) {
        if (selectingPay) {
            if (token === receiveToken) return;
            setPayToken(token);
        } else {
            if (token === payToken) return;
            setReceiveToken(token);
        }
        setModalOpen(false);
    }

    //----------------------------------------------------
    // SWITCH TOKEN
    //----------------------------------------------------

    function reverseToken() {
        const token = payToken;
        setPayToken(receiveToken);
        setReceiveToken(token);

        const amount = payAmount;
        setPayAmount(receiveAmount);
        setReceiveAmount(amount);
    }

    //----------------------------------------------------
    // HANDLE SWAP WITH TOAST
    //----------------------------------------------------
    async function handleSwap() {
        if (noChainSelected) return;

        try {
            setTxHash(""); // Reset hash lama
            const receipt = await executeSwap();
            
            // Ekstrak hash dari transaction receipt / response ethers.js v6
            let hashVal = "";
            if (typeof receipt === "string") {
                hashVal = receipt;
            } else if (receipt?.hash) {
                hashVal = receipt.hash;
            } else if (receipt?.transactionHash) {
                hashVal = receipt.transactionHash;
            }

            if (hashVal) {
                setTxHash(hashVal);
            }
            
            setToastOpen(true);
        } catch (e) {
            console.error("Swap error:", e);
        }
    }

    //----------------------------------------------------

    return (
        <div className="swap-wrapper">
            <div
                className={
                    "swap-card" +
                    (noChainSelected ? " swap-card-disabled" : "")
                }
            >
                {noChainSelected && (
                    <div className="swap-network-overlay">
                        Select a network first
                    </div>
                )}

                <div className="swap-header">
                    <h2>
                        Swap
                    </h2>
                    <button
                        className="settingButton"
                        onClick={() =>
                            setSettingOpen(true)
                        }
                    >
                        <Settings size={20} />
                    </button>
                </div>

                <TokenInput
                    title="You Pay"
                    token={payToken}
                    amount={payAmount}
                    balance={payBalance}
                    onAmountChange={setPayAmount}
                    onTokenClick={openPay}
                />

                <button
                    className="swap-switch"
                    onClick={reverseToken}
                >
                    <ArrowDownUp size={24} />
                </button>

                <TokenInput
                    title="You Receive"
                    token={receiveToken}
                    amount={receiveAmount}
                    balance={receiveBalance}
                    onAmountChange={setReceiveAmount}
                    onTokenClick={openReceive}
                />

                <div className="swap-info">
                    <div>
                        <span>Price</span>
                        <b>{price}</b>
                    </div>
                    <div>
                        <span>Minimum Received</span>
                        <b>{minimumReceived}</b>
                    </div>
                    <div>
                        <span>Price Impact</span>
                        <b>{priceImpact}</b>
                    </div>
                    <div>
                        <span>Liquidity Fee</span>
                        <b>0.30%</b>
                    </div>
                </div>

                <SwapButton
                    loading={loading}
                    loadingText="Swapping..."
                    text={
                        noChainSelected
                            ? "Select Network"
                            : "Swap"
                    }
                    disabled={noChainSelected}
                    onClick={handleSwap}
                />
            </div>

            <div className="swap-social">
                <a
                    href="https://t.me/HEX_AMM"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                    className="swap-social-link"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M21.94 4.6c.24-1.02-.75-1.85-1.72-1.47L2.7 10.24c-.98.39-.96 1.83.03 2.19l4.32 1.56 1.67 5.35c.22.71 1.1.93 1.62.4l2.4-2.44 4.4 3.25c.79.58 1.92.15 2.13-.8L21.94 4.6zM8.6 13.2l9.5-6.1-7.9 7.6-.3 3.1-1.3-4.6z" />
                    </svg>
                    <span>Telegram</span>
                </a>

                <a
                    href="https://x.com/HEX_AG"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X (Twitter)"
                    className="swap-social-link"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M18.24 2.75h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.83-5.97 6.83H1.65l7.74-8.85L1.25 2.75h6.83l4.72 6.24 5.44-6.24zm-1.16 17.52h1.83L7.02 4.62H5.05l12.03 15.65z" />
                    </svg>
                    <span>X</span>
                </a>
            </div>

            <TokenModal
                open={modalOpen}
                onClose={() =>
                    setModalOpen(false)
                }
                onSelect={handleSelect}
            />

            <SettingsModal
                open={settingOpen}
                onClose={() =>
                    setSettingOpen(false)
                }
            />

            <Toast
                open={toastOpen}
                title="Success"
                message="Swap executed successfully"
                tx={txHash}
                explorer={chain?.explorer?.replace(/\/+$/, "")}
                onClose={() => setToastOpen(false)}
            />
        </div>
    );
}