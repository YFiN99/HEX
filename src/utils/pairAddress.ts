// src/utils/pairAddress.ts
//
// Computes a HexSwap pair's address instantly, client-side, with zero
// RPC calls -- mirrors contracts/libraries/HexPairAddress.sol exactly.
//
// IMPORTANT: PAIR_INIT_CODE_HASH below must always match the constant
// of the same name in HexPairAddress.sol. If you ever regenerate that
// constant (see scripts/computeInitCodeHash.js), update it here too.

import { getCreate2Address, keccak256, solidityPacked, getAddress } from "ethers";

// Keep in sync with contracts/libraries/HexPairAddress.sol
const PAIR_INIT_CODE_HASH =
    "0x008f6374b4ad721d954091fa04b003cc5148cd76813c053d84222e39a00d50d8";

/**
 * Computes the deterministic pair address for two token addresses on
 * a given factory, instantly and offline (pure math, no network
 * call). Does NOT confirm the pair has actually been created yet --
 * callers that need that guarantee should still check the address's
 * on-chain bytecode (or fall back to factory.getPair(...)) before
 * relying on it holding real reserves.
 */
export function computePairAddress(
    factoryAddress: string,
    tokenA: string,
    tokenB: string
): string {
    const [token0, token1] =
        tokenA.toLowerCase() < tokenB.toLowerCase()
            ? [tokenA, tokenB]
            : [tokenB, tokenA];

    const salt = keccak256(
        solidityPacked(["address", "address"], [getAddress(token0), getAddress(token1)])
    );

    return getCreate2Address(getAddress(factoryAddress), salt, PAIR_INIT_CODE_HASH);
}