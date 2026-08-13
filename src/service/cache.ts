// src/service/cache.ts

// ============================================================
// PAIR ADDRESS CACHE
// ============================================================

const pairAddressCache =
    new Map<string, string>();

// ============================================================
// POOL DATA CACHE
// ============================================================

const poolDataCache =
    new Map<string, any[]>();

// ============================================================
// PAIR KEY
// ============================================================

export function makePairKey(
    chainId: number,
    factoryAddress: string,
    tokenA: string,
    tokenB: string
): string {

    return [
        chainId,
        factoryAddress.toLowerCase(),
        tokenA.toLowerCase(),
        tokenB.toLowerCase()
    ].join(":");

}

// ============================================================
// GET PAIR ADDRESS
// ============================================================

export function getCachedPair(
    key: string
): string | null {

    return (
        pairAddressCache.get(key)
        ?? null
    );

}

// ============================================================
// SET PAIR ADDRESS
// ============================================================

export function setCachedPair(
    key: string,
    pairAddress: string
): void {

    pairAddressCache.set(
        key,
        pairAddress
    );

}

// ============================================================
// REMOVE PAIR CACHE
// ============================================================

export function removeCachedPair(
    key: string
): void {

    pairAddressCache.delete(key);

}

// ============================================================
// CLEAR ALL PAIR CACHE
// ============================================================

export function clearPairCache(): void {

    pairAddressCache.clear();

}

// ============================================================
// GET POOL DATA
// ============================================================

export function getCachedPools(
    key: string
): any[] | null {

    return (
        poolDataCache.get(key)
        ?? null
    );

}

// ============================================================
// SET POOL DATA
// ============================================================

export function setCachedPools(
    key: string,
    pools: any[]
): void {

    poolDataCache.set(
        key,
        pools
    );

}

// ============================================================
// CLEAR POOL CACHE
// ============================================================

export function clearPoolCache(
    key?: string
): void {

    if (key) {

        poolDataCache.delete(key);

        return;

    }

    poolDataCache.clear();

}

// ============================================================
// CLEAR EVERYTHING
// ============================================================

export function clearAllCache(): void {

    pairAddressCache.clear();

    poolDataCache.clear();

}