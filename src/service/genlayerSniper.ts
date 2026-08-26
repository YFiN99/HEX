// src/service/genlayerSniper.ts

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

// Alamat kontrak ContractSniper (versi fixed, dengan eq_principle)
// yang sudah di-deploy di GenLayer Studio.
export const SNIPER_CONTRACT_ADDRESS =
    "0xfD6A06aFF3822feA1aA03E439f6ef6AD87C13610";

// Info jaringan GenLayer Studio (hosted dev environment).
export const GENLAYER_STUDIO_CHAIN = {
    chainIdHex: "0xf22f", // 61999
    chainIdDecimal: 61999,
    chainName: "GenLayer Studio",
    rpcUrl: "https://studio.genlayer.com/api",
    nativeSymbol: "GEN",
    explorer: "https://explorer-studio.genlayer.com"
};

/**
 * Memastikan MetaMask sedang berada di jaringan GenLayer Studio
 * sebelum menandatangani transaksi apa pun -- kalau belum ada,
 * otomatis diminta ditambahkan (sama seperti switchChain() untuk
 * chain EVM lain di WalletContext.tsx).
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

/**
 * Client GenLayer untuk membaca (read-only), tidak butuh wallet.
 */
function getReadClient() {
    return createClient({
        chain: studionet
    });
}

/**
 * Client GenLayer untuk menulis (write), pakai alamat wallet yang
 * sudah connect (MetaMask) -- sama seperti yang dipakai di
 * WalletContext untuk chain EVM lainnya.
 */
function getWriteClient(connectedAddress: string) {
    return createClient({
        chain: studionet,
        account: connectedAddress as `0x${string}`
    });
}

/**
 * Membaca laporan AI terakhir yang tersimpan di kontrak
 * (get_latest_report -- fungsi view, gratis, tanpa wallet).
 */
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
 * Memicu pemindaian baru (scan_new_projects_blockchain -- fungsi
 * write, butuh wallet & gas, dan diproses lewat konsensus validator
 * GenLayer sampai status FINALIZED).
 */
export async function triggerScan(
    connectedAddress: string
): Promise<string> {

    await ensureGenLayerNetwork();

    const client = getWriteClient(connectedAddress);

    const txHash = await client.writeContract({
        address: SNIPER_CONTRACT_ADDRESS,
        functionName: "scan_new_projects_blockchain",
        args: [],
        value: 0n
    });

    const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        // ACCEPTED = konsensus validator sudah setuju & leader sudah
        // eksekusi -- cukup dipercaya untuk dibaca. FINALIZED butuh
        // ronde konfirmasi tambahan yang bisa jauh lebih lama, jadi
        // untuk UX yang responsif kita tidak menunggu sampai situ.
        status: TransactionStatus.ACCEPTED,
        retries: 100,
        interval: 5000
    });

    // Setelah finalized, ambil laporan terbaru langsung dari state kontrak.
    const latestReport = await readLatestReport();

    return latestReport;
}