// src/service/sniperPair.ts

import { Contract } from "ethers";

import SniperPairAbi from "../abi/SniperPair.json";

export function getSniperPair(
    signerOrProvider: any,
    sniperPairAddress: string
) {
    return new Contract(
        sniperPairAddress,
        SniperPairAbi,
        signerOrProvider
    );
}

export type BatchPairInfo = {
    tokenA: string;
    tokenB: string;
    pairAddress: string;
    reserve0: bigint;
    reserve1: bigint;
    exists: boolean;
};

/**
 * Reads pair address + reserves for many token combinations in a
 * SINGLE RPC call, instead of one factory.getPair() call per
 * combination. `tokensA`/`tokensB` must be the same length and
 * index-aligned (tokensA[i] paired with tokensB[i]).
 */
export async function getMultiplePairsInfo(
    sniperPair: Contract,
    tokensA: string[],
    tokensB: string[]
): Promise<BatchPairInfo[]> {

    const raw = await sniperPair.getMultiplePairsInfo(
        tokensA,
        tokensB
    );

    return raw.map((entry: any) => ({
        tokenA: entry.tokenA,
        tokenB: entry.tokenB,
        pairAddress: entry.pairAddress,
        reserve0: BigInt(entry.reserve0.toString()),
        reserve1: BigInt(entry.reserve1.toString()),
        exists: entry.exists
    }));
}