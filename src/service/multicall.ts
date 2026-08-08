// src/service/multicall.ts

import {
    BrowserProvider,
    Contract,
    Interface,
    JsonRpcProvider
} from "ethers";

import { CHAINS } from "../config/chain";

// ============================================================
// TYPES
// ============================================================

export type MulticallBalanceToken = {
    address: string;
    balance: bigint;
};

export type MulticallCall = {
    target: string;
    allowFailure: boolean;
    callData: string;
};

export type MulticallResult = {
    success: boolean;
    returnData: string;
};

// ============================================================
// MULTICALL ABI
// ============================================================

const MULTICALL_ABI = [
    "function aggregate3((address target,bool allowFailure,bytes callData)[] calls) payable returns ((bool success,bytes returnData)[] returnData)"
];

// ============================================================
// ERC20 ABI
// ============================================================

const ERC20_INTERFACE = new Interface([
    "function balanceOf(address owner) view returns (uint256)"
]);

// ============================================================
// GET CHAIN
// ============================================================

function getChain(chainId: number) {

    const chain =
        CHAINS.find(
            chain => chain.chainId === chainId
        );

    if (!chain) {
        throw new Error(
            `Unsupported chain: ${chainId}`
        );
    }

    return chain;
}

// ============================================================
// GET MULTICALL CONTRACT
// ============================================================

function getMulticall(
    provider:
        | BrowserProvider
        | JsonRpcProvider,
    chainId: number
) {

    const chain =
        getChain(chainId);

    if (
        !chain.multicall3 ||
        chain.multicall3 === "0x"
    ) {

        throw new Error(
            `Multicall3 address missing for ${chain.chainName}`
        );
    }

    return new Contract(
        chain.multicall3,
        MULTICALL_ABI,
        provider
    );
}

// ============================================================
// NATIVE BALANCE
// ============================================================

async function getNativeBalance(
    provider:
        | BrowserProvider
        | JsonRpcProvider,
    address: string
): Promise<bigint> {

    return await provider.getBalance(
        address
    );
}

// ============================================================
// ERC20 BALANCES - MULTICALL
// ============================================================

export async function getTokenBalances(
    provider:
        | BrowserProvider
        | JsonRpcProvider,
    chainId: number,
    walletAddress: string,
    tokenAddresses: string[]
): Promise<bigint[]> {

    if (
        !provider ||
        !walletAddress
    ) {
        return tokenAddresses.map(
            () => 0n
        );
    }

    if (
        tokenAddresses.length === 0
    ) {
        return [];
    }

    const multicall =
        getMulticall(
            provider,
            chainId
        );

    // ========================================================
    // BUILD CALLS
    // ========================================================

    const calls =
        tokenAddresses.map(
            tokenAddress => {

                const callData =
                    ERC20_INTERFACE.encodeFunctionData(
                        "balanceOf",
                        [walletAddress]
                    );

                return {
                    target: tokenAddress,
                    allowFailure: true,
                    callData
                };
            }
        );

    // ========================================================
    // EXECUTE ONE MULTICALL
    // ========================================================

    const results =
        await multicall.aggregate3(
            calls
        );

    // ========================================================
    // DECODE RESULTS
    // ========================================================

    return results.map(
        (
            result: {
                success: boolean;
                returnData: string;
            }
        ) => {

            if (
                !result.success ||
                !result.returnData ||
                result.returnData === "0x"
            ) {
                return 0n;
            }

            try {

                const decoded =
                    ERC20_INTERFACE.decodeFunctionResult(
                        "balanceOf",
                        result.returnData
                    );

                return BigInt(
                    decoded[0].toString()
                );

            } catch (error) {

                console.error(
                    "Multicall decode error:",
                    error
                );

                return 0n;
            }
        }
    );
}

// ============================================================
// TOKEN BALANCES + NATIVE BALANCE
// ============================================================

export async function getBalances(
    provider:
        | BrowserProvider
        | JsonRpcProvider,
    chainId: number,
    walletAddress: string,
    tokenAddresses: string[]
) {

    // ========================================================
    // NATIVE + ERC20 DIJALANKAN BERSAMA
    // ========================================================

    const [
        nativeBalance,
        tokenBalances
    ] =
        await Promise.all([
            getNativeBalance(
                provider,
                walletAddress
            ),

            getTokenBalances(
                provider,
                chainId,
                walletAddress,
                tokenAddresses
            )
        ]);

    return {
        nativeBalance,
        tokenBalances
    };
}

// ============================================================
// BALANCES MAPPED BY TOKEN ADDRESS
// ============================================================

export async function getBalancesMap(
    provider:
        | BrowserProvider
        | JsonRpcProvider,
    chainId: number,
    walletAddress: string,
    tokenAddresses: string[]
): Promise<Map<string, bigint>> {

    const balances =
        await getTokenBalances(
            provider,
            chainId,
            walletAddress,
            tokenAddresses
        );

    const map =
        new Map<string, bigint>();

    tokenAddresses.forEach(
        (
            tokenAddress,
            index
        ) => {

            map.set(
                tokenAddress.toLowerCase(),
                balances[index] ?? 0n
            );

        }
    );

    return map;
}

// ============================================================
// SINGLE TOKEN BALANCE VIA MULTICALL
// ============================================================

export async function getTokenBalance(
    provider:
        | BrowserProvider
        | JsonRpcProvider,
    chainId: number,
    walletAddress: string,
    tokenAddress: string
): Promise<bigint> {

    const balances =
        await getTokenBalances(
            provider,
            chainId,
            walletAddress,
            [tokenAddress]
        );

    return balances[0] ?? 0n;
}