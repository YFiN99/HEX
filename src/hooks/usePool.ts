import {
    useEffect,
    useMemo,
    useState,
    useCallback,
    useRef
} from "react";

import { ethers } from "ethers";

import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";

import {
    getFactory,
    getPairAddress
} from "../service/factory";

import {
    getPair,
    balanceOf,
    totalSupply,
    getReserves
} from "../service/pair";

import {
    makePairKey,
    getCachedPair,
    setCachedPair,
    getCachedPools,
    setCachedPools
} from "../service/cache";


// ============================================================
// TYPES
// ============================================================

type Pool = {
    token0: string;
    token1: string;

    address: string;

    reserve0: bigint;
    reserve1: bigint;

    lp: bigint;

    totalSupply: bigint;
};


// ============================================================
// HOOK
// ============================================================

export default function usePool() {

    const {
        provider,
        address,
        chainId
    } = useWallet();


    // =========================================================
    // CURRENT CHAIN
    // =========================================================

    const chain = useMemo(() => {

        return CHAINS.find(
            c => c.chainId === chainId
        );

    }, [chainId]);


    // =========================================================
    // STATE
    // =========================================================

    const [pairs, setPairs] =
        useState<Pool[]>([]);

    const [loading, setLoading] =
        useState(false);


    // =========================================================
    // REQUEST ID
    //
    // Mencegah hasil RPC chain lama
    // menimpa chain baru.
    // =========================================================

    const requestId =
        useRef(0);


    // =========================================================
    // LOAD POOLS
    // =========================================================

    const loadPools = useCallback(
        async (
            forceRefresh = false
        ) => {

            if (
                !provider ||
                !chain
            ) {

                setPairs([]);

                setLoading(false);

                return;
            }


            // -------------------------------------------------
            // REQUEST ID BARU
            // -------------------------------------------------

            const currentRequest =
                ++requestId.current;


            // -------------------------------------------------
            // CACHE KEY
            //
            // chain + wallet
            //
            // LP balance berbeda antar wallet.
            // -------------------------------------------------

            const walletKey =
                address
                    ? address.toLowerCase()
                    : "disconnected";


            const poolCacheKey =
                `${chain.chainId}:${chain.factory.toLowerCase()}:${walletKey}`;


            // =================================================
            // TAMPILKAN CACHE DULU
            // =================================================

            const cachedPools =
                getCachedPools(
                    poolCacheKey
                );


            if (
                cachedPools &&
                cachedPools.length > 0
            ) {

                setPairs(
                    cachedPools as Pool[]
                );

            }


            // =================================================
            // LOADING
            //
            // Kalau sudah ada cache,
            // jangan kosongkan UI.
            // =================================================

            if (
                !cachedPools ||
                cachedPools.length === 0
            ) {

                setLoading(true);

            }


            try {

                // =================================================
                // FACTORY
                // =================================================

                const factory =
                    getFactory(
                        provider,
                        chain.factory
                    );


                // =================================================
                // BUILD TOKEN PAIRS
                //
                // Token wrapped-native (mis. HexWETH, WQTER, WX1)
                // DIKELUARKAN dari daftar sumber kombinasi di sini.
                //
                // Alasannya: token native (mis. "ETH") di bawah ini
                // otomatis dikonversi ke chain.wrappedNative saat
                // di-query on-chain -- ALAMATNYA SAMA PERSIS dengan
                // entri token wrapped-native itu sendiri. Kalau
                // keduanya sama-sama masuk loop, kombinasi seperti
                // (BTC, ETH) dan (BTC, HexWETH) akan resolve ke pair
                // contract yang SAMA PERSIS di on-chain, tapi tampil
                // sebagai 2 baris pool terpisah dengan angka identik.
                // =================================================

                const poolableTokens =
                    chain.tokens.filter(
                        token =>
                            !(token as any).isWrappedNative
                    );

                const requests: {
                    A: any;
                    B: any;
                    tokenA: string;
                    tokenB: string;
                }[] = [];


                for (
                    let i = 0;
                    i < poolableTokens.length;
                    i++
                ) {

                    for (
                        let j = i + 1;
                        j < poolableTokens.length;
                        j++
                    ) {

                        const A =
                            poolableTokens[i];

                        const B =
                            poolableTokens[j];


                        const tokenA =
                            A.address === "native"
                                ? chain.wrappedNative
                                : A.address;


                        const tokenB =
                            B.address === "native"
                                ? chain.wrappedNative
                                : B.address;


                        // ------------------------------------------------
                        // Jangan query token yang sama
                        // ------------------------------------------------

                        if (
                            tokenA.toLowerCase() ===
                            tokenB.toLowerCase()
                        ) {

                            continue;

                        }


                        requests.push({

                            A,

                            B,

                            tokenA,

                            tokenB

                        });

                    }

                }


                // =================================================
                // GET PAIR ADDRESS
                //
                // CACHE FIRST
                //
                // RPC hanya untuk pair yang belum ada cache.
                // =================================================

                const pairResults =
                    await Promise.all(

                        requests.map(
                            async ({
                                A,
                                B,
                                tokenA,
                                tokenB
                            }) => {

                                try {

                                    const pairKey =
                                        makePairKey(
                                            chain.chainId,
                                            chain.factory,
                                            tokenA,
                                            tokenB
                                        );


                                    // ------------------------------------------------
                                    // CEK CACHE
                                    // ------------------------------------------------

                                    let pairAddress =
                                        getCachedPair(
                                            pairKey
                                        );


                                    // ------------------------------------------------
                                    // JIKA BELUM ADA CACHE
                                    // QUERY FACTORY
                                    // ------------------------------------------------

                                    if (
                                        !pairAddress
                                    ) {

                                        pairAddress =
                                            await getPairAddress(
                                                factory,
                                                tokenA,
                                                tokenB
                                            );


                                        // ------------------------------------------------
                                        // Pair tidak ada
                                        // ------------------------------------------------

                                        if (
                                            !pairAddress ||
                                            pairAddress ===
                                                ethers.ZeroAddress
                                        ) {

                                            return null;

                                        }


                                        // ------------------------------------------------
                                        // SIMPAN CACHE
                                        // ------------------------------------------------

                                        setCachedPair(
                                            pairKey,
                                            pairAddress
                                        );

                                    }


                                    // ------------------------------------------------
                                    // INVALID
                                    // ------------------------------------------------

                                    if (
                                        !pairAddress ||
                                        pairAddress ===
                                            ethers.ZeroAddress
                                    ) {

                                        return null;

                                    }


                                    return {

                                        A,

                                        B,

                                        pairAddress

                                    };

                                }
                                catch (
                                    error
                                ) {

                                    console.error(
                                        "getPairAddress:",
                                        error
                                    );

                                    return null;

                                }

                            }
                        )

                    );


                // =================================================
                // CEK REQUEST
                //
                // User mungkin sudah pindah chain.
                // =================================================

                if (
                    currentRequest !==
                    requestId.current
                ) {

                    return;

                }


                // =================================================
                // EXISTING PAIRS
                // =================================================

                const existingPairs =
                    pairResults.filter(
                        Boolean
                    ) as {
                        A: any;
                        B: any;
                        pairAddress: string;
                    }[];


                // =================================================
                // GET RESERVES / SUPPLY / LP
                //
                // SEMUA POOL PARALLEL
                // =================================================

                const poolResults =
                    await Promise.all(

                        existingPairs.map(
                            async ({
                                A,
                                B,
                                pairAddress
                            }) => {

                                try {

                                    const pair =
                                        getPair(
                                            provider,
                                            pairAddress
                                        );


                                    const [
                                        reserve,
                                        supply,
                                        lp
                                    ] =
                                        await Promise.all([

                                            getReserves(
                                                pair
                                            ),

                                            totalSupply(
                                                pair
                                            ),

                                            address
                                                ? balanceOf(
                                                    pair,
                                                    address
                                                )
                                                : Promise.resolve(
                                                    0n
                                                )

                                        ]);


                                    return {

                                        token0:
                                            A.symbol,

                                        token1:
                                            B.symbol,

                                        address:
                                            pairAddress,

                                        reserve0:
                                            reserve[0],

                                        reserve1:
                                            reserve[1],

                                        lp,

                                        totalSupply:
                                            supply

                                    };

                                }
                                catch (
                                    error
                                ) {

                                    console.error(
                                        "Pool read:",
                                        pairAddress,
                                        error
                                    );

                                    return null;

                                }

                            }
                        )

                    );


                // =================================================
                // CEK REQUEST LAGI
                // =================================================

                if (
                    currentRequest !==
                    requestId.current
                ) {

                    return;

                }


                // =================================================
                // FILTER
                // =================================================

                const validPools =
                    poolResults.filter(
                        Boolean
                    ) as Pool[];


                // =================================================
                // SORT
                //
                // Pool yang punya LP user
                // tampil paling atas.
                // =================================================

                validPools.sort(
                    (
                        a,
                        b
                    ) => {

                        const aLP =
                            BigInt(
                                a.lp ?? 0n
                            );

                        const bLP =
                            BigInt(
                                b.lp ?? 0n
                            );


                        if (
                            aLP > 0n &&
                            bLP === 0n
                        ) {

                            return -1;

                        }


                        if (
                            aLP === 0n &&
                            bLP > 0n
                        ) {

                            return 1;

                        }


                        return 0;

                    }
                );


                // =================================================
                // SIMPAN POOL KE CACHE
                // =================================================

                setCachedPools(
                    poolCacheKey,
                    validPools
                );


                // =================================================
                // UPDATE UI
                // =================================================

                setPairs(
                    validPools
                );

            }
            catch (
                error
            ) {

                console.error(
                    "usePool load error:",
                    error
                );


                // ------------------------------------------------
                // Jangan hapus cache kalau RPC error.
                // ------------------------------------------------

                if (
                    cachedPools &&
                    cachedPools.length > 0
                ) {

                    setPairs(
                        cachedPools as Pool[]
                    );

                }

            }
            finally {

                if (
                    currentRequest ===
                    requestId.current
                ) {

                    setLoading(false);

                }

            }

        },
        [
            provider,
            chain,
            address
        ]
    );


    // =========================================================
    // INITIAL / CHAIN CHANGE
    // =========================================================

    useEffect(
        () => {

            loadPools();

        },
        [
            loadPools
        ]
    );


    // =========================================================
    // BACKGROUND REFRESH
    //
    // Setiap 15 detik.
    //
    // User tetap bisa melihat cache
    // sementara RPC diperbarui.
    // =========================================================

    useEffect(
        () => {

            if (
                !provider ||
                !chain
            ) {

                return;

            }


            const interval =
                window.setInterval(
                    () => {

                        loadPools(
                            true
                        );

                    },
                    15_000
                );


            return () => {

                window.clearInterval(
                    interval
                );

            };

        },
        [
            provider,
            chain,
            address,
            loadPools
        ]
    );


    // =========================================================
    // RETURN
    // =========================================================

    return {

        pairs,

        loading,

        refresh: () =>
            loadPools(true)

    };

}