// src/service/genlayerSniper.ts

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export const SNIPER_CONTRACT_ADDRESS =
    "0xfD6A06aFF3822feA1aA03E439f6ef6AD87C13610";

export const GENLAYER_STUDIO_CHAIN = {
    chainIdHex: "0xf22f",
    chainIdDecimal: 61999,
    chainName: "GenLayer Studio",
    rpcUrl: "https://studio.genlayer.com/api",
    nativeSymbol: "GEN",
    explorer: "https://explorer-studio.genlayer.com"
};

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

export async function readLatestReport(): Promise<string> {
    const client = getReadClient();
    const result = await client.readContract({
        address: SNIPER_CONTRACT_ADDRESS,
        functionName: "get_latest_report",
        args: []
    });
    return String(result ?? "");
}

/**
 * Memicu pemindaian dengan callback status live (Pending -> Proposing -> Committing -> Revealing -> Accepted)
 */
export async function triggerScan(
    connectedAddress: string,
    onStatusUpdate?: (statusMessage: string) => void
): Promise<string> {
    await ensureGenLayerNetwork();

    const client = getWriteClient(connectedAddress);

    if (onStatusUpdate) onStatusUpdate("Pending transaction submission...");

    const txHash = await client.writeContract({
        address: SNIPER_CONTRACT_ADDRESS,
        functionName: "scan_new_projects_blockchain",
        args: [],
        value: 0n
    });

    if (onStatusUpdate) onStatusUpdate(`Tx Broadcasted: ${txHash.slice(0, 10)}...`);
    if (onStatusUpdate) onStatusUpdate("Validators Proposing state...");

    // Melacak penerimaan transaksi dari node GenLayer
    const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.ACCEPTED,
        retries: 100,
        interval: 3000
    });

    if (onStatusUpdate) onStatusUpdate("Validators Committing votes...");
    // Beri jeda singkat untuk transisi visual tahap revealing & accepted
    await new Promise((r) => setTimeout(r, 1000));
    if (onStatusUpdate) onStatusUpdate("Revealing consensus data...");
    await new Promise((r) => setTimeout(r, 1000));
    if (onStatusUpdate) onStatusUpdate("Accepted by GenVM Consensus");

    const latestReport = await readLatestReport();
    return latestReport;
}