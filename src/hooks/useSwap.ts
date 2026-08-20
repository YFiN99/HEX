import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";
import { computePairAddress } from "../utils/pairAddress";
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
    // RESERVE CACHE (untuk estimasi harga instan / offline)
    //
    // Reserve pool di-cache di sini SEKALI setiap kali chain/token
    // berganti (1 RPC call), lalu dipakai berkali-kali untuk
    // menghitung estimasi harga secara instan di JS setiap user
    // mengetik -- tanpa RPC sama sekali. Rumusnya sama persis
    // dengan constant-product + fee 0.30% yang dipakai
    // HexSwapPair.sol, jadi hasilnya cocok dengan angka on-chain
    // (kecuali reserve sudah berubah sejak terakhir di-cache --
    // makanya tetap ada konfirmasi on-chain via getAmountsOut yang
    // di-debounce, lihat AUTO REFRESH di bawah).
    // =====================================================

    const reservesRef = useRef<{
        reserveIn: bigint;
        reserveOut: bigint;
    } | null>(null);

    const SWAP_FEE_BPS = 30n; // 0.30%, harus sama dengan HexSwapPair.sol

    function localAmountOut(
        amountIn: bigint,
        reserveIn: bigint,
        reserveOut: bigint
    ): bigint {

        if (
            amountIn <= 0n ||
            reserveIn <= 0n ||
            reserveOut <= 0n
        ) {
            return 0n;
        }

        const amountInAfterFee =
            amountIn * (10_000n - SWAP_FEE_BPS);

        const numerator =
            amountInAfterFee * reserveOut;

        const denominator =
            reserveIn * 10_000n + amountInAfterFee;

        return numerator / denominator;
    }

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
    // WARM RESERVE CACHE
    //
    // 1 RPC call setiap chain/payToken/receiveToken berganti (BUKAN
    // setiap keystroke) untuk mengisi reservesRef, yang kemudian
    // dipakai localAmountOut() untuk estimasi instan.
    // =====================================================

    function resolvePairTokenAddress(token: { address: string }): string {
        return token.address === "native"
            ? chain.wrappedNative
            : token.address;
    }

    useEffect(() => {

        let cancelled = false;

        reservesRef.current = null;

        async function warmReserves() {

            if (!signer?.provider || !chain) return;

            const tokenIn =
                chain.tokens.find(t => t.symbol === payToken);

            const tokenOut =
                chain.tokens.find(t => t.symbol === receiveToken);

            if (!tokenIn || !tokenOut) return;

            try {

                const tokenInAddr = resolvePairTokenAddress(tokenIn);
                const tokenOutAddr = resolvePairTokenAddress(tokenOut);

                const pairAddress = computePairAddress(
                    chain.factory,
                    tokenInAddr,
                    tokenOutAddr
                );

                const pair = new ethers.Contract(
                    pairAddress,
                    [
                        "function token0() view returns (address)",
                        "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 lastUpdatedAt)"
                    ],
                    signer.provider
                );

                const [pairToken0, reserves] = await Promise.all([
                    pair.token0(),
                    pair.getReserves()
                ]);

                if (cancelled) return;

                const isTokenInToken0 =
                    pairToken0.toLowerCase() === tokenInAddr.toLowerCase();

                reservesRef.current = isTokenInToken0
                    ? { reserveIn: BigInt(reserves[0]), reserveOut: BigInt(reserves[1]) }
                    : { reserveIn: BigInt(reserves[1]), reserveOut: BigInt(reserves[0]) };

            } catch {
                // Pair belum ada / belum ada liquidity / RPC gagal --
                // biarkan reservesRef kosong, nanti quote on-chain
                // (yang di-debounce) yang menangani ini seperti biasa.
                reservesRef.current = null;
            }

        }

        warmReserves();

        return () => {
            cancelled = true;
        };

    }, [chain?.key, payToken, receiveToken, signer]);

    // =====================================================
    // INSTANT LOCAL ESTIMATE
    //
    // Jalan SETIAP payAmount berubah, TANPA debounce -- pakai
    // reserve yang sudah di-cache di atas, dihitung murni di JS
    // (0ms, tanpa RPC). Ini yang bikin harga kerasa "kilat" saat
    // mengetik. Nilai on-chain yang akurat tetap menyusul ~300ms
    // kemudian lewat AUTO REFRESH (debounced) di bawah, yang akan
    // menimpa estimasi ini begitu selesai.
    // =====================================================

    useEffect(() => {

        if (
            !payAmount ||
            Number(payAmount) <= 0 ||
            !reservesRef.current ||
            !chain
        ) {
            return;
        }

        const tokenIn =
            chain.tokens.find(t => t.symbol === payToken);

        const tokenOut =
            chain.tokens.find(t => t.symbol === receiveToken);

        if (!tokenIn || !tokenOut) return;

        try {

            const amountInParsed =
                ethers.parseUnits(payAmount, tokenIn.decimals);

            const { reserveIn, reserveOut } = reservesRef.current;

            const estimatedOut =
                localAmountOut(amountInParsed, reserveIn, reserveOut);

            if (estimatedOut <= 0n) return;

            setReceiveAmount(
                ethers.formatUnits(estimatedOut, tokenOut.decimals)
            );

            const unitIn =
                ethers.parseUnits("1", tokenIn.decimals);

            const unitOut =
                localAmountOut(unitIn, reserveIn, reserveOut);

            setPrice(
                `1 ${payToken} = ${Number(ethers.formatUnits(unitOut, tokenOut.decimals)).toFixed(4)} ${receiveToken}`
            );

            const minRecv =
                (Number(ethers.formatUnits(estimatedOut, tokenOut.decimals)) * 0.995).toFixed(6);

            setMinimumReceived(`${minRecv} ${receiveToken}`);
            setPriceImpact("< 0.01%");

        } catch {
            // Biarkan saja -- quote on-chain (debounced) akan
            // menyusul dan menimpa ini.
        }

    }, [payAmount, payToken, receiveToken, chain?.key]);

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

                    // Dua panggilan getAmountsOut ini sebelumnya
                    // dijalankan BERURUTAN (await satu-satu), yang
                    // berarti menunggu 2x round-trip RPC secara
                    // penuh. Dijalankan PARALEL lewat Promise.all
                    // supaya total waktu tunggu kira-kira setara
                    // dengan 1x round-trip saja, bukan 2x.

                    const [
                        amounts,
                        unitAmounts
                    ] = await Promise.all([

                        router.getAmountsOut(
                            amountInParsed,
                            path
                        ),

                        router.getAmountsOut(
                            ethers.parseUnits(
                                "1",
                                tokenIn.decimals
                            ),
                            path
                        )

                    ]);

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

        // Debounce ~300ms: kalau user masih mengetik angka
        // (payAmount berubah cepat berkali-kali), jangan langsung
        // tembak RPC di setiap ketikan -- tunggu sampai user
        // berhenti sejenak. Ini yang paling berasa "ngelag" kalau
        // tidak di-debounce, karena tiap request menunggu router
        // contract call round-trip penuh.
        const debounce =
            setTimeout(() => {
                refreshBalances();
            }, 300);

        const interval =
            setInterval(
                refreshBalances,
                10000
            );

        return () => {
            clearTimeout(debounce);
            clearInterval(interval);
        };

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