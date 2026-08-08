import "./RemoveLiquidityCard.css";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

import SwapButton from "../SwapButton/SwapButton";
import Toast from "../Toast/Toast";

import { useNavigation } from "../../hooks/useNavigation";
import { useLiquidity } from "../../hooks/useLiquidity";
import usePosition from "../../hooks/usePosition";
import useReserves from "../../hooks/useReserves";

import { useWallet } from "../../context/WalletContext";
import { CHAINS } from "../../config/chain";

export default function RemoveLiquidityCard() {
    const { navigate, state: selectedPool } =
        useNavigation();

    const { chainId } = useWallet();

    const chain = useMemo(() => {
        return (
            CHAINS.find(
                (c) => c.chainId === chainId
            ) || CHAINS[0]
        );
    }, [chainId]);

    // =====================================================
    // POSITION
    // =====================================================

    const {
        position: fetchedPosition,
        refresh
    } = usePosition();

    const position = useMemo(() => {
        if (selectedPool) {
            const rawLp =
                selectedPool.lp ??
                selectedPool.balance ??
                selectedPool.lpBalance ??
                0n;

            return {
                token:
                    selectedPool.token0Address ??
                    selectedPool.token ??
                    "",

                symbol:
                    selectedPool.token1 ??
                    "Token",

                lp:
                    typeof rawLp === "bigint"
                        ? rawLp
                        : BigInt(
                            rawLp?.toString() ||
                            "0"
                        ),

                pair:
                    selectedPool.pair ??
                    selectedPool.pairAddress ??
                    ""
            };
        }

        return fetchedPosition;
    }, [
        selectedPool,
        fetchedPosition
    ]);

    // =====================================================
    // PAIR ADDRESS
    // =====================================================

    const pairAddress = useMemo(() => {
        return (
            selectedPool?.pair ??
            selectedPool?.pairAddress ??
            position?.pair ??
            ""
        );
    }, [
        selectedPool,
        position
    ]);

    // =====================================================
    // RESERVES
    // =====================================================

    const {
        reserve0,
        reserve1,
        totalSupply,
        refreshReserve,
        loading: reserveLoading
    } = useReserves(
        pairAddress || undefined
    );

    // =====================================================
    // LIQUIDITY
    // =====================================================

    const {
        removeLiquidityETH
    } = useLiquidity();

    // =====================================================
    // STATE
    // =====================================================

    const [percent, setPercent] =
        useState(0);

    const [loading, setLoading] =
        useState(false);

    // =====================================================
    // TOAST STATE & TIMER
    // Sama seperti SwapCard
    // =====================================================

    const [toastOpen, setToastOpen] =
        useState(false);

    const [txHash, setTxHash] =
        useState("");

    useEffect(() => {
        if (!toastOpen)
            return;

        const timer =
            setTimeout(() => {
                setToastOpen(false);
            }, 7000);

        return () =>
            clearTimeout(timer);
    }, [toastOpen]);

    // =====================================================
    // REFRESH RESERVES
    // =====================================================

    useEffect(() => {
        if (!pairAddress)
            return;

        if (
            typeof refreshReserve ===
            "function"
        ) {
            void refreshReserve();
        }
    }, [
        pairAddress,
        refreshReserve
    ]);

    // =====================================================
    // LP BALANCE
    // =====================================================

    const lpBalance = useMemo(() => {
        if (selectedPool) {
            const rawLp =
                selectedPool.lp ??
                selectedPool.balance ??
                selectedPool.lpBalance ??
                0n;

            try {
                return typeof rawLp === "bigint"
                    ? rawLp
                    : BigInt(
                        rawLp?.toString() ||
                        "0"
                    );
            } catch {
                return 0n;
            }
        }

        if (!position)
            return 0n;

        try {
            return typeof position.lp === "bigint"
                ? position.lp
                : BigInt(
                    position.lp?.toString() ||
                    "0"
                );
        } catch {
            return 0n;
        }
    }, [
        selectedPool,
        position
    ]);

    // =====================================================
    // LP YANG AKAN DIBURN
    // =====================================================

    const removingLP = useMemo(() => {
        if (
            lpBalance === 0n ||
            percent <= 0
        ) {
            return 0n;
        }

        return (
            lpBalance *
            BigInt(percent)
        ) / 100n;
    }, [
        lpBalance,
        percent
    ]);

    // =====================================================
    // NATIVE YANG DITERIMA
    // =====================================================

    const receiveNative = useMemo(() => {
        if (
            totalSupply === 0n ||
            removingLP === 0n
        ) {
            return "0";
        }

        const amount =
            reserve0 *
            removingLP /
            totalSupply;

        return ethers.formatEther(
            amount
        );
    }, [
        reserve0,
        removingLP,
        totalSupply
    ]);

    // =====================================================
    // TOKEN YANG DITERIMA
    // =====================================================

    const receiveToken = useMemo(() => {
        if (
            totalSupply === 0n ||
            removingLP === 0n
        ) {
            return "0";
        }

        const amount =
            reserve1 *
            removingLP /
            totalSupply;

        return ethers.formatEther(
            amount
        );
    }, [
        reserve1,
        removingLP,
        totalSupply
    ]);

    // =====================================================
    // HANDLE REMOVE
    // =====================================================

    async function handleRemove() {
        const tokenAddress =
            selectedPool?.token0Address ??
            selectedPool?.token ??
            position?.token ??
            "";

        const actualPairAddress =
            selectedPool?.pair ??
            selectedPool?.pairAddress ??
            position?.pair ??
            "";

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!tokenAddress) {
            console.error(
                "RemoveLiquidity: token address missing",
                {
                    selectedPool,
                    position
                }
            );
            return;
        }

        if (!actualPairAddress) {
            console.error(
                "RemoveLiquidity: pair address missing",
                {
                    selectedPool,
                    position
                }
            );
            return;
        }

        if (
            actualPairAddress ===
            ethers.ZeroAddress
        ) {
            console.error(
                "RemoveLiquidity: invalid pair address"
            );
            return;
        }

        if (removingLP === 0n) {
            console.error(
                "RemoveLiquidity: liquidity is zero"
            );
            return;
        }

        if (totalSupply === 0n) {
            console.error(
                "RemoveLiquidity: total supply is zero"
            );
            return;
        }

        // -------------------------------------------------
        // EXECUTE
        // -------------------------------------------------

        try {
            setLoading(true);

            // Reset toast/hash lama
            setToastOpen(false);
            setTxHash("");

            console.log(
                "Removing liquidity:",
                {
                    tokenAddress,
                    pairAddress:
                        actualPairAddress,
                    lpBalance:
                        lpBalance.toString(),
                    removingLP:
                        removingLP.toString(),
                    percent
                }
            );

            const receipt =
                await removeLiquidityETH(
                    tokenAddress,
                    removingLP,
                    actualPairAddress
                );

            // -------------------------------------------------
            // AMBIL TRANSACTION HASH
            // Sama seperti SwapCard
            // -------------------------------------------------

            let hashVal = "";

            if (
                typeof receipt ===
                "string"
            ) {
                hashVal = receipt;
            } else if (
                receipt?.hash
            ) {
                hashVal =
                    receipt.hash;
            } else if (
                receipt?.transactionHash
            ) {
                hashVal =
                    receipt.transactionHash;
            }

            if (hashVal) {
                setTxHash(hashVal);
            }

            // -------------------------------------------------
            // REFRESH DATA
            // -------------------------------------------------

            if (
                typeof refresh ===
                "function"
            ) {
                await refresh();
            }

            if (
                typeof refreshReserve ===
                "function"
            ) {
                await refreshReserve();
            }

            setPercent(0);

            // -------------------------------------------------
            // SUCCESS TOAST
            // -------------------------------------------------

            setToastOpen(true);

        } catch (err) {
            console.error(
                "Remove liquidity error:",
                err
            );

            // Jangan pakai alert.
            // Sama seperti SwapCard:
            // error hanya dicatat ke console.
        } finally {
            setLoading(false);
        }
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="remove-wrapper">

            <div className="remove-card">

                {/* =========================================
                    HEADER
                ========================================= */}

                <div className="remove-header">

                    <button
                        className="backButton"
                        onClick={() =>
                            navigate("pool")
                        }
                        disabled={loading}
                    >
                        ← Back
                    </button>

                    <h2>
                        Remove Liquidity
                    </h2>

                </div>

                {/* =========================================
                    LP BALANCE
                ========================================= */}

                <div className="lpBalance">

                    <span>
                        LP Balance
                    </span>

                    <b>
                        {ethers.formatEther(
                            lpBalance
                        )} LP
                    </b>

                </div>

                {/* =========================================
                    PAIR
                ========================================= */}

                <div className="remove-pair-info">

                    <span>
                        Pair
                    </span>

                    <b>
                        {pairAddress
                            ? `${pairAddress.slice(
                                0,
                                6
                            )}...${pairAddress.slice(
                                -4
                            )}`
                            : "Not found"}
                    </b>

                </div>

                {/* =========================================
                    SLIDER
                ========================================= */}

                <div className="sliderArea">

                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={percent}
                        disabled={
                            loading ||
                            lpBalance === 0n
                        }
                        onChange={(e) =>
                            setPercent(
                                Number(
                                    e.target.value
                                )
                            )
                        }
                    />

                    <h2>
                        {percent}%
                    </h2>

                </div>

                {/* =========================================
                    QUICK BUTTONS
                ========================================= */}

                <div className="quickButtons">

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            setPercent(25)
                        }
                    >
                        25%
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            setPercent(50)
                        }
                    >
                        50%
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            setPercent(75)
                        }
                    >
                        75%
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            setPercent(100)
                        }
                    >
                        MAX
                    </button>

                </div>

                {/* =========================================
                    RECEIVE
                ========================================= */}

                <div className="receiveInfo">

                    <div>

                        <span>
                            {chain?.nativeSymbol ??
                                "Native"}
                        </span>

                        <b>
                            {reserveLoading
                                ? "Loading..."
                                : receiveNative}
                        </b>

                    </div>

                    <div>

                        <span>
                            {selectedPool?.token1 ??
                                position?.symbol ??
                                "Token"}
                        </span>

                        <b>
                            {reserveLoading
                                ? "Loading..."
                                : receiveToken}
                        </b>

                    </div>

                </div>

                {/* =========================================
                    SUMMARY
                ========================================= */}

                <div className="removeSummary">

                    <div>

                        <span>
                            LP To Burn
                        </span>

                        <b>
                            {ethers.formatEther(
                                removingLP
                            )} LP
                        </b>

                    </div>

                    <div>

                        <span>
                            Share Removed
                        </span>

                        <b>
                            {percent}%
                        </b>

                    </div>

                </div>

                {/* =========================================
                    REMOVE BUTTON
                ========================================= */}

                <SwapButton
                    loading={loading}
                    loadingText="Removing..."
                    text="REMOVE LIQUIDITY"
                    disabled={
                        loading ||
                        !tokenAddressForButton(
                            selectedPool,
                            position
                        ) ||
                        !pairAddress ||
                        removingLP === 0n
                    }
                    onClick={
                        handleRemove
                    }
                />

            </div>

            {/* =============================================
                TOAST
                Sama seperti SwapCard
            ============================================= */}

            <Toast
                open={toastOpen}
                title="Success"
                message="Liquidity removed successfully"
                tx={txHash}
                explorer={chain?.explorer?.replace(
                    /\/+$/,
                    ""
                )}
                onClose={() =>
                    setToastOpen(false)
                }
            />

        </div>
    );
}

// =====================================================
// BUTTON VALIDATION
// =====================================================

function tokenAddressForButton(
    selectedPool: any,
    position: any
): string {
    return (
        selectedPool?.token0Address ??
        selectedPool?.token ??
        position?.token ??
        ""
    );
}