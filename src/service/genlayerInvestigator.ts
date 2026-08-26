// src/service/genlayerInvestigator.ts

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

import { ensureGenLayerNetwork } from "./genlayerSniper";

// Alamat kontrak AirdropInvestigator yang sudah di-deploy di GenLayer Studio.
export const INVESTIGATOR_CONTRACT_ADDRESS =
    "0xe2771DD5b5f30D92c9443F5e4C459B91F7226924";

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
 * Membaca hasil analisis/konten terakhir (get_last_analysis --
 * fungsi view, gratis, tanpa wallet).
 */
export async function readLastAnalysis(): Promise<string> {

    const client = getReadClient();

    const result = await client.readContract({
        address: INVESTIGATOR_CONTRACT_ADDRESS,
        functionName: "get_last_analysis",
        args: []
    });

    return String(result ?? "");
}

/**
 * Memicu investigasi + pembuatan konten untuk sebuah URL
 * (investigate_and_create_content -- fungsi write, butuh wallet &
 * gas, diproses lewat konsensus validator GenLayer sampai
 * FINALIZED).
 */
export async function investigateUrl(
    connectedAddress: string,
    targetUrl: string
): Promise<string> {

    await ensureGenLayerNetwork();

    const client = getWriteClient(connectedAddress);

    const txHash = await client.writeContract({
        address: INVESTIGATOR_CONTRACT_ADDRESS,
        functionName: "investigate_and_create_content",
        args: [targetUrl],
        value: 0n
    });

    const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.ACCEPTED,
        retries: 100,
        interval: 5000
    });

    const latest = await readLastAnalysis();

    return latest;
}