import "./SwapCard.css";

import { useEffect, useMemo, useState } from "react";
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

    const chain = useMemo(() => {
        // Cari berdasarkan chainId, jika tidak ketemu gunakan chain pertama (index 0) sebagai fallback
        return CHAINS.find(c => c.chainId === chainId) || CHAINS[0];
    }, [chainId]);

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
    useEffect(() => {
        if (!chain || !chain.tokens || chain.tokens.length === 0) return;

        // Cek apakah payToken dan receiveToken ada di dalam daftar token chain saat ini
        const isPayValid = chain.tokens.some(t => t.symbol === payToken);
        const isReceiveValid = chain.tokens.some(t => t.symbol === receiveToken);

        // Jika salah satu token tidak valid atau kosong, reset ke token default chain ini
        if (!isPayValid || !isReceiveValid || payToken === receiveToken) {
            if (chain.tokens.length >= 2) {
                setPayToken(chain.tokens[0].symbol);
                setReceiveToken(chain.tokens[1].symbol);
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
        setSelectingPay(true);
        setModalOpen(true);
    }

    function openReceive() {
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
            <div className="swap-card">
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
                    text="Swap"
                    onClick={handleSwap}
                />
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