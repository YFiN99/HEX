import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";

import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";

import { getBalances } from "../service/multicall";

export default function useBalance(
    payToken: string,
    receiveToken: string
) {

    const {
        provider,
        address,
        chainId
    } = useWallet();

    const [payBalance, setPayBalance] =
        useState("0");

    const [receiveBalance, setReceiveBalance] =
        useState("0");

    const [loading, setLoading] =
        useState(false);

    // =========================================================
    // CURRENT CHAIN
    // =========================================================

    const chain =
        CHAINS.find(
            c => c.chainId === chainId
        );

    // =========================================================
    // FIND TOKEN
    // =========================================================

    const resolveToken = useCallback(
        (tokenIdentifier: string) => {

            if (!chain || !tokenIdentifier) {
                return null;
            }

            // -------------------------------------------------
            // NATIVE
            // -------------------------------------------------

            if (
                tokenIdentifier ===
                chain.nativeSymbol
            ) {

                return {
                    address: "native",
                    decimals: 18,
                    native: true
                };

            }

            // -------------------------------------------------
            // SYMBOL
            // -------------------------------------------------

            if (
                !tokenIdentifier
                    .toLowerCase()
                    .startsWith("0x")
            ) {

                const token =
                    chain.tokens.find(
                        t =>
                            t.symbol ===
                            tokenIdentifier
                    );

                if (!token) {
                    return null;
                }

                if (
                    token.address ===
                    "native"
                ) {

                    return {
                        address: "native",
                        decimals:
                            token.decimals,
                        native: true
                    };

                }

                return {
                    address:
                        token.address,
                    decimals:
                        token.decimals,
                    native: false
                };

            }

            // -------------------------------------------------
            // DIRECT ADDRESS
            // -------------------------------------------------

            return {
                address:
                    tokenIdentifier,
                decimals: 18,
                native: false
            };

        },
        [chain]
    );

    // =========================================================
    // LOAD BALANCES
    // =========================================================

    const refreshBalances =
        useCallback(
            async () => {

                if (
                    !provider ||
                    !address ||
                    !chain
                ) {

                    setPayBalance("0");
                    setReceiveBalance("0");

                    return;
                }

                const pay =
                    resolveToken(
                        payToken
                    );

                const receive =
                    resolveToken(
                        receiveToken
                    );

                if (!pay && !receive) {

                    setPayBalance("0");
                    setReceiveBalance("0");

                    return;
                }

                setLoading(true);

                try {

                    // =================================================
                    // NATIVE BALANCE
                    // =================================================

                    let nativeBalance =
                        0n;

                    const needsNative =
                        !!(
                            pay?.native ||
                            receive?.native
                        );

                    if (needsNative) {

                        nativeBalance =
                            await provider.getBalance(
                                address
                            );

                    }

                    // =================================================
                    // ERC20 ADDRESSES
                    // =================================================

                    const tokenAddresses: string[] = [];

                    if (
                        pay &&
                        !pay.native
                    ) {

                        tokenAddresses.push(
                            pay.address
                        );

                    }

                    if (
                        receive &&
                        !receive.native
                    ) {

                        // Jangan query dua kali
                        // kalau token sama.

                        if (
                            !tokenAddresses.some(
                                a =>
                                    a.toLowerCase() ===
                                    receive.address.toLowerCase()
                            )
                        ) {

                            tokenAddresses.push(
                                receive.address
                            );

                        }

                    }

                    // =================================================
                    // MULTICALL
                    // =================================================

                    let tokenBalances: bigint[] =
                        [];

                    if (
                        tokenAddresses.length > 0
                    ) {

                        // ------------------------------------------------
                        // Kalau Multicall3 tersedia
                        // ------------------------------------------------

                        if (
                            chain.multicall3 &&
                            chain.multicall3 !==
                                "0x"
                        ) {

                            const result =
                                await getBalances(
                                    provider,
                                    chainId,
                                    address,
                                    tokenAddresses
                                );

                            tokenBalances =
                                result.tokenBalances;

                        }

                        // ------------------------------------------------
                        // Fallback
                        // ------------------------------------------------

                        else {

                            tokenBalances =
                                await Promise.all(

                                    tokenAddresses.map(
                                        async tokenAddress => {

                                            try {

                                                const contract =
                                                    new ethers.Contract(
                                                        tokenAddress,
                                                        [
                                                            "function balanceOf(address) view returns (uint256)"
                                                        ],
                                                        provider
                                                    );

                                                return BigInt(
                                                    (
                                                        await contract.balanceOf(
                                                            address
                                                        )
                                                    ).toString()
                                                );

                                            } catch (
                                                error
                                            ) {

                                                console.error(
                                                    "Balance fallback:",
                                                    error
                                                );

                                                return 0n;

                                            }

                                        }
                                    )

                                );

                        }

                    }

                    // =================================================
                    // BALANCE MAP
                    // =================================================

                    const balanceMap =
                        new Map<
                            string,
                            bigint
                        >();

                    tokenAddresses.forEach(
                        (
                            tokenAddress,
                            index
                        ) => {

                            balanceMap.set(
                                tokenAddress.toLowerCase(),
                                tokenBalances[
                                    index
                                ] ?? 0n
                            );

                        }
                    );

                    // =================================================
                    // PAY BALANCE
                    // =================================================

                    let payValue =
                        "0";

                    if (pay) {

                        if (
                            pay.native
                        ) {

                            payValue =
                                ethers.formatUnits(
                                    nativeBalance,
                                    pay.decimals
                                );

                        } else {

                            const value =
                                balanceMap.get(
                                    pay.address
                                        .toLowerCase()
                                ) ?? 0n;

                            payValue =
                                ethers.formatUnits(
                                    value,
                                    pay.decimals
                                );

                        }

                    }

                    // =================================================
                    // RECEIVE BALANCE
                    // =================================================

                    let receiveValue =
                        "0";

                    if (receive) {

                        if (
                            receive.native
                        ) {

                            receiveValue =
                                ethers.formatUnits(
                                    nativeBalance,
                                    receive.decimals
                                );

                        } else {

                            const value =
                                balanceMap.get(
                                    receive.address
                                        .toLowerCase()
                                ) ?? 0n;

                            receiveValue =
                                ethers.formatUnits(
                                    value,
                                    receive.decimals
                                );

                        }

                    }

                    setPayBalance(
                        payValue
                    );

                    setReceiveBalance(
                        receiveValue
                    );

                } catch (error) {

                    console.error(
                        "useBalance:",
                        error
                    );

                    setPayBalance("0");
                    setReceiveBalance("0");

                } finally {

                    setLoading(false);

                }

            },
            [
                provider,
                address,
                chain,
                chainId,
                payToken,
                receiveToken,
                resolveToken
            ]
        );

    // =========================================================
    // AUTO REFRESH
    // =========================================================

    useEffect(() => {

        refreshBalances();

    }, [
        refreshBalances
    ]);

    // =========================================================
    // RETURN
    // =========================================================

    return {

        payBalance,

        receiveBalance,

        refreshBalances,

        loading

    };
}