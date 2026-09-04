// src/service/justice.ts

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

// Alamat Smart Contract Justice terbaru di GenLayer Studio
export const JUSTICE_CONTRACT_ADDRESS =
    "0xCa9C5b490AF036eb9fB39D2eb54F896BBa6e7684";

export const GENLAYER_STUDIO_CHAIN = {
    chainIdHex: "0xf22f",
    chainIdDecimal: 61999,
    chainName: "GenLayer Studio",
    rpcUrl: "https://studio.genlayer.com/api",
    nativeSymbol: "GEN",
    explorer: "https://explorer-studio.genlayer.com"
};

/**
 * Memastikan koneksi MetaMask terhubung ke jaringan GenLayer Studio
 */
export async function ensureGenLayerNetwork(): Promise<void> {
    if (!window.ethereum) {
        throw new Error("MetaMask tidak ditemukan.");
    }

    const currentChainId = await window.ethereum.request({
        method: "eth_chainId"
    });

    if (
        currentChainId.toLowerCase() ===
        GENLAYER_STUDIO_CHAIN.chainIdHex.toLowerCase()
    ) {
        return;
    }

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: GENLAYER_STUDIO_CHAIN.chainIdHex }]
        });
    } catch (switchError: any) {
        if (
            switchError?.code === 4902 ||
            switchError?.code === -32603
        ) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: GENLAYER_STUDIO_CHAIN.chainIdHex,
                    chainName: GENLAYER_STUDIO_CHAIN.chainName,
                    nativeCurrency: {
                        name: GENLAYER_STUDIO_CHAIN.nativeSymbol,
                        symbol: GENLAYER_STUDIO_CHAIN.nativeSymbol,
                        decimals: 18
                    },
                    rpcUrls: [GENLAYER_STUDIO_CHAIN.rpcUrl],
                    blockExplorerUrls: [GENLAYER_STUDIO_CHAIN.explorer]
                }]
            });
        } else {
            throw switchError;
        }
    }
}

function getReadClient() {
    return createClient({
        chain: studionet
    });
}

function getWriteClient(connectedAddress: string) {
    return createClient({
        chain: studionet,
        account: connectedAddress as `0x${string}`
    });
}

/**
 * Membaca status persetujuan keamanan kasus token (Read-only)
 */
export async function checkIsJusticeApproved(caseId: string): Promise<boolean> {
    const client = getReadClient();
    try {
        const result = await client.readContract({
            address: JUSTICE_CONTRACT_ADDRESS,
            functionName: "is_justice_approved",
            args: [caseId]
        });
        return Boolean(result);
    } catch (error) {
        return false;
    }
}

/**
 * Membaca putusan penuh kasus berdasarkan case_id
 */
export async function getCaseVerdict(caseId: string): Promise<string> {
    const client = getReadClient();
    try {
        const result = await client.readContract({
            address: JUSTICE_CONTRACT_ADDRESS,
            functionName: "get_case_verdict",
            args: [caseId]
        });
        return String(result);
    } catch (error) {
        return "NOT_FOUND";
    }
}

/**
 * OTOMATIS RUN SCAN (In-Background / Auto Trigger)
 * Fungsi ini dipanggil otomatis dari Frontend saat user memilih/mengklik token
 * Tanpa perlu tombol 'Snipe' atau input manual.
 */
export async function autoExecuteJusticeScan(
    connectedAddress: string,
    targetIdentifier: string,
    platformType: string = "DEX_SCREENER",
    onStatusUpdate?: (statusMessage: string) => void
): Promise<{ success: boolean; caseId: string; result: string }> {
    await ensureGenLayerNetwork();

    // Auto generate caseId unik di background
    const caseId = `case-${Date.now()}`;
    
    // Auto clean input target jika user mengirimkan link URL DexScreener/Pump.fun
    let cleanTarget = targetIdentifier.trim();
    if (cleanTarget.startsWith("http://") || cleanTarget.startsWith("https://")) {
        const parts = cleanTarget.replace(/\/$/, "").split("/");
        cleanTarget = parts[parts.length - 1];
    }

    const client = getWriteClient(connectedAddress);

    if (onStatusUpdate) onStatusUpdate("Broadcasting Justice Scan...");

    try {
        const txHash = await client.writeContract({
            address: JUSTICE_CONTRACT_ADDRESS,
            functionName: "execute_justice_scan",
            args: [caseId, cleanTarget, platformType],
            value: 0n
        });

        if (onStatusUpdate) onStatusUpdate(`Tx Sent: ${txHash.slice(0, 10)}...`);

        await client.waitForTransactionReceipt({
            hash: txHash,
            status: TransactionStatus.ACCEPTED,
            retries: 100,
            interval: 3000
        });

        if (onStatusUpdate) onStatusUpdate("Scan Complete. Verifying Consensus...");

        const verdictResult = await getCaseVerdict(caseId);
        return {
            success: true,
            caseId,
            result: verdictResult
        };
    } catch (error: any) {
        if (onStatusUpdate) onStatusUpdate("Scan Execution Failed.");
        return {
            success: false,
            caseId,
            result: error?.message || "Execution Failed"
        };
    }
}