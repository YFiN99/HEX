import { Contract } from "ethers";

import EasySwapFactory from "../abi/EasySwapFactory.json";

export function getFactory(
    signerOrProvider: any,
    factoryAddress: string
) {
    return new Contract(
        factoryAddress,
        EasySwapFactory.abi,
        signerOrProvider
    );
}

export async function getPairAddress(
    factory: Contract,
    tokenA: string,
    tokenB: string
) {
    return await factory.getPair(tokenA, tokenB);
}

// Backward compatibility
export async function getPair(
    factory: Contract,
    tokenA: string,
    tokenB: string
) {
    return getPairAddress(factory, tokenA, tokenB);
}

export async function allPairsLength(
    factory: Contract
) {
    return await factory.allPairsLength();
}

export async function allPairs(
    factory: Contract,
    index: number
) {
    return await factory.allPairs(index);
}

export async function createPair(
    factory: Contract,
    tokenA: string,
    tokenB: string
) {
    const tx = await factory.createPair(tokenA, tokenB);
    return tx.wait();
}

export async function feeTo(
    factory: Contract
) {
    return await factory.feeTo();
}

export async function feeToSetter(
    factory: Contract
) {
    return await factory.feeToSetter();
}

export async function pairExists(
    factory: Contract,
    tokenA: string,
    tokenB: string
) {
    const pair = await factory.getPair(tokenA, tokenB);

    return pair !== "0x0000000000000000000000000000000000000000";
}