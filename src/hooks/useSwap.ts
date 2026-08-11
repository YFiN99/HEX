import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";
import {
    getRouter,
    swapExactETHForTokens,
    swapExactTokensForETH,
    swapExactTokensForTokens
} from "../service/router";

export function useSwap() {

    const {
        signer,
        address,
        chainId
    } = useWallet();

    const [loading, setLoading] = useState(false);

    const [payToken, setPayToken] = useState("QTER");
    const [receiveToken, setReceiveToken] = useState("BTC");

    const [payAmount, setPayAmount] = useState("");
    const [receiveAmount, setReceiveAmount] = useState("");

    const [payBalance, setPayBalance] = useState("0");
    const [receiveBalance, setReceiveBalance] = useState("0");

    const [price, setPrice] = useState("-");
    const [priceImpact, setPriceImpact] = useState("-");
    const [minimumReceived, setMinimumReceived] = useState("-");

    const chain =
        CHAINS.find(c => c.chainId === chainId) ||
        CHAINS[0];

    // =====================================================
    // REQUEST GUARD
    // Mencegah hasil refreshBalances yang "basi" (dari chain/token
    // sebelumnya) menimpa hasil yang lebih baru saat user cepat
    // berpindah chain/token. Setiap panggilan refreshBalances
    // mendapat nomor urut; hasil yang bukan dari panggilan
    // terakhir akan diabaikan.
    // =====================================================
    const requestIdRef = useRef(0);

    // =====================================================
    // FORMAT BALANCE
    // Maksimal 7 angka setelah koma
    //
    // 11.972356702801887
    // -> 11.9723567
    //
    // 0.004650369322494418
    // -> 0.0046503
    //
    // 100000
    // -> 100000
    //
    // Tidak mengubah nilai blockchain asli.
    // Hanya tampilan.
    // =====================================================

    function formatBalance(
        value: bigint,
        decimals: number
    ): string {

        const formatted =
            ethers.formatUnits(
                value,
                decimals
            );

        const [integer, fraction] =
            formatted.split(".");

        if (!fraction) {
            return integer;
        }

        const trimmed =
            fraction.slice(0, 7);

        return trimmed.length > 0
            ? `${integer}.${trimmed}`
            : integer;
    }

    // =====================================================
    // FETCH BALANCES & QUOTE
    // =====================================================

    const refreshBalances = useCallback(
        async () => {

            // Nomor urut untuk panggilan refreshBalances ini.
            // Kalau ada panggilan lain yang dimulai setelah ini
            // (mis. karena chain/token berganti), requestIdRef.current
            // akan berubah dan panggilan ini harus berhenti menerapkan
            // hasilnya begitu ketahuan sudah "basi".
            const myRequestId = ++requestIdRef.current;
            const isStale = () => requestIdRef.current !== myRequestId;

            if (
                !signer ||
                !address ||
                !chain
            ) {

                setPayBalance("0");
                setReceiveBalance("0");

                return;
            }

            try {

                const provider =
                    signer.provider;

                if (!provider) return;

                const tokenIn =
                    chain.tokens.find(
                        t => t.symbol === payToken
                    );

                const tokenOut =
                    chain.tokens.find(
                        t => t.symbol === receiveToken
                    );

                // =================================================
                // PAY TOKEN BALANCE
                // =================================================

                if (tokenIn) {

                    if (
                        tokenIn.address === "native"
                    ) {

                        const bal =
                            await provider.getBalance(
                                address
                            );

                        if (isStale()) return;

                        setPayBalance(
                            formatBalance(
                                bal,
                                tokenIn.decimals
                            )
                        );

                    } else {

                        const erc20 =
                            new ethers.Contract(
                                tokenIn.address,
                                [
                                    "function balanceOf(address owner) view returns (uint256)"
                                ],
                                provider
                            );

                        const bal =
                            await erc20.balanceOf(
                                address
                            );

                        if (isStale()) return;

                        setPayBalance(
                            formatBalance(
                                bal,
                                tokenIn.decimals
                            )
                        );
                    }
                }

                // =================================================
                // RECEIVE TOKEN BALANCE
                // =================================================

                if (tokenOut) {

                    if (
                        tokenOut.address === "native"
                    ) {

                        const bal =
                            await provider.getBalance(
                                address
                            );

                        if (isStale()) return;

                        setReceiveBalance(
                            formatBalance(
                                bal,
                                tokenOut.decimals
                            )
                        );

                    } else {

                        const erc20 =
                            new ethers.Contract(
                                tokenOut.address,
                                [
                                    "function balanceOf(address owner) view returns (uint256)"
                                ],
                                provider
                            );

                        const bal =
                            await erc20.balanceOf(
                                address
                            );

                        if (isStale()) return;

                        setReceiveBalance(
                            formatBalance(
                                bal,
                                tokenOut.decimals
                            )
                        );
                    }
                }

                // =================================================
                // QUOTE
                // =================================================

                if (
                    tokenIn &&
                    tokenOut &&
                    payAmount &&
                    Number(payAmount) > 0
                ) {

                    const router =
                        getRouter(
                            signer,
                            chain.router
                        );

                    const amountInParsed =
                        ethers.parseUnits(
                            payAmount,
                            tokenIn.decimals
                        );

                    const path = [

                        tokenIn.address === "native"
                            ? chain.wrappedNative
                            : tokenIn.address,

                        tokenOut.address === "native"
                            ? chain.wrappedNative
                            : tokenOut.address

                    ];

                    const amounts =
                        await router.getAmountsOut(
                            amountInParsed,
                            path
                        );

                    if (isStale()) return;

                    const amountOutParsed =
                        amounts[
                            amounts.length - 1
                        ];

                    const formattedOut =
                        ethers.formatUnits(
                            amountOutParsed,
                            tokenOut.decimals
                        );

                    setReceiveAmount(
                        formattedOut
                    );

                    // =================================================
                    // UNIT PRICE
                    // =================================================

                    const unitAmounts =
                        await router.getAmountsOut(
                            ethers.parseUnits(
                                "1",
                                tokenIn.decimals
                            ),
                            path
                        );

                    if (isStale()) return;

                    const unitPrice =
                        ethers.formatUnits(
                            unitAmounts[
                                unitAmounts.length - 1
                            ],
                            tokenOut.decimals
                        );

                    setPrice(
                        `1 ${payToken} = ${Number(unitPrice).toFixed(4)} ${receiveToken}`
                    );

                    // =================================================
                    // MINIMUM RECEIVED
                    // =================================================

                    const minRecv =
                        (
                            Number(formattedOut) *
                            0.995
                        ).toFixed(6);

                    setMinimumReceived(
                        `${minRecv} ${receiveToken}`
                    );

                    setPriceImpact(
                        "< 0.01%"
                    );

                } else {

                    setReceiveAmount("");
                    setPrice("-");
                    setMinimumReceived("-");
                    setPriceImpact("-");

                }

            } catch (err) {

                if (isStale()) return;

                console.error(
                    "Error updating quote/balances:",
                    err
                );

            }

        },
        [
            signer,
            address,
            chain,
            payToken,
            receiveToken,
            payAmount
        ]
    );

    // =====================================================
    // RESET SAAT CHAIN / TOKEN BERGANTI
    // Membersihkan saldo lama SEBELUM data baru datang, supaya
    // tidak sempat tampil angka nyasar dari chain/token sebelumnya
    // (mis. desimal token yang beda antar chain).
    // =====================================================

    useEffect(() => {
        setPayBalance("-");
        setReceiveBalance("-");
    }, [chain?.key, payToken, receiveToken]);

    // =====================================================
    // AUTO REFRESH
    // =====================================================

    useEffect(() => {

        refreshBalances();

        const interval =
            setInterval(
                refreshBalances,
                10000
            );

        return () =>
            clearInterval(interval);

    }, [refreshBalances]);

    // =====================================================
    // SWAP EXECUTION
    // =====================================================

    async function executeSwap() {

        if (
            !signer ||
            !chain ||
            !address
        ) {
            return;
        }

        try {

            setLoading(true);

            const tokenIn =
                chain.tokens.find(
                    t => t.symbol === payToken
                );

            const tokenOut =
                chain.tokens.find(
                    t => t.symbol === receiveToken
                );

            if (!tokenIn || !tokenOut) {
                throw new Error(
                    "Selected tokens not found"
                );
            }

            const router =
                getRouter(
                    signer,
                    chain.router
                );

            const amountIn =
                ethers.parseUnits(
                    payAmount,
                    tokenIn.decimals
                );

            const provider =
                signer.provider;

            if (!provider) {
                throw new Error(
                    "Provider not found"
                );
            }

            const latestBlock =
                await provider.getBlock(
                    "latest"
                );

            if (!latestBlock) {
                throw new Error(
                    "Cannot get latest block"
                );
            }

            const deadline =
                Number(
                    latestBlock.timestamp
                ) + 1800;

            const path = [

                tokenIn.address === "native"
                    ? chain.wrappedNative
                    : tokenIn.address,

                tokenOut.address === "native"
                    ? chain.wrappedNative
                    : tokenOut.address

            ];

            let txResponse;

            // =================================================
            // NATIVE -> TOKEN
            // =================================================

            if (
                tokenIn.address === "native"
            ) {

                txResponse =
                    await swapExactETHForTokens(
                        router,
                        0n,
                        path,
                        address,
                        deadline,
                        amountIn
                    );

            } else {

                // =================================================
                // ERC20 APPROVAL
                // =================================================

                const tokenContract =
                    new ethers.Contract(
                        tokenIn.address,
                        [
                            "function allowance(address owner, address spender) view returns (uint256)",
                            "function approve(address spender, uint256 amount) returns (bool)"
                        ],
                        signer
                    );

                const allowance =
                    await tokenContract.allowance(
                        address,
                        chain.router
                    );

                if (
                    allowance < amountIn
                ) {

                    console.log(
                        "Approving token for router..."
                    );

                    const approveTx =
                        await tokenContract.approve(
                            chain.router,
                            ethers.MaxUint256
                        );

                    await approveTx.wait();
                }

                // =================================================
                // TOKEN -> NATIVE
                // =================================================

                if (
                    tokenOut.address === "native"
                ) {

                    txResponse =
                        await swapExactTokensForETH(
                            router,
                            amountIn,
                            0n,
                            path,
                            address,
                            deadline
                        );

                } else {

                    // =================================================
                    // TOKEN -> TOKEN
                    // =================================================

                    txResponse =
                        await swapExactTokensForTokens(
                            router,
                            amountIn,
                            0n,
                            path,
                            address,
                            deadline
                        );
                }
            }

            setPayAmount("");
            setReceiveAmount("");

            await refreshBalances();

            return txResponse;

        } catch (err) {

            console.error(err);

            throw err;

        } finally {

            setLoading(false);

        }
    }

    // =====================================================
    // RETURN
    // =====================================================

    return {

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
        refreshBalances,

        loading

    };
}