import { Contract } from "ethers";

import EasySwapPair from "../abi/EasySwapPair.json";

export function getPair(
    provider: any,
    address: string
) {
    return new Contract(
        address,
        EasySwapPair.abi,
        provider
    );
}

export async function totalSupply(
    pair: Contract
) {
    return await pair.totalSupply();
}

export async function balanceOf(
    pair: Contract,
    owner: string
) {
    return await pair.balanceOf(owner);
}

export async function getReserves(
    pair: Contract
) {
    return await pair.getReserves();
}

export async function token0(
    pair: Contract
) {
    return await pair.token0();
}

export async function token1(
    pair: Contract
) {
    return await pair.token1();
}