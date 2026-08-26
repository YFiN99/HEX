// src/service/genlayerCodeAuditor.ts

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

import { ensureGenLayerNetwork } from "./genlayerSniper";

// Alamat kontrak AICodeAuditor yang sudah di-deploy di GenLayer Studio.
export const CODE_AUDITOR_CONTRACT_ADDRESS =
    "0x6de3F5F083c877371d7b2Dc221ECb993216033C1";

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
 * Membaca laporan audit terakhir (get_latest_audit -- fungsi view,
 * gratis, tanpa wallet).
 */
export async function readLatestAudit(): Promise<string> {

    const client = getReadClient();

    const result = await client.readContract({
        address: CODE_AUDITOR_CONTRACT_ADDRESS,
        functionName: "get_latest_audit",
        args: []
    });

    return String(result ?? "");
}

/**
 * Mengirim source code untuk diaudit AI (audit_and_fix_code --
 * fungsi write, butuh wallet & gas, diproses lewat konsensus
 * validator GenLayer).
 */
export async function auditCode(
    connectedAddress: string,
    sourceCode: string
): Promise<string> {

    await ensureGenLayerNetwork();

    const client = getWriteClient(connectedAddress);

    const txHash = await client.writeContract({
        address: CODE_AUDITOR_CONTRACT_ADDRESS,
        functionName: "audit_and_fix_code",
        args: [sourceCode],
        value: 0n
    });

    const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.ACCEPTED,
        retries: 100,
        interval: 5000
    });

    const latest = await readLatestAudit();

    return latest;
}