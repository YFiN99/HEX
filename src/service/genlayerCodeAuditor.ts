// src/service/genlayerCodeAuditor.ts

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

import { ensureGenLayerNetwork } from "./genlayerSniper";

// Newly deployed AIaskglobal contract address
export const CODE_AUDITOR_CONTRACT_ADDRESS =
    "0x40062E33d9AFbC9F0c2A7972D5C6D3Ac938dA1E3";

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
 * Reads the latest AI answer / report (get_latest_answer -- view function,
 * free, no wallet required).
 */
export async function readLatestAudit(): Promise<string> {
    const client = getReadClient();
    try {
        const result = await client.readContract({
            address: CODE_AUDITOR_CONTRACT_ADDRESS,
            functionName: "get_latest_answer",
            args: []
        });
        return String(result ?? "");
    } catch {
        return "";
    }
}

/**
 * Sends a query/source code to the AI assistant (ask_anything --
 * write function, requires wallet & gas, processed through GenLayer
 * validator consensus).
 */
export async function auditCode(
    connectedAddress: string,
    sourceCode: string
): Promise<string> {
    await ensureGenLayerNetwork();

    const client = getWriteClient(connectedAddress);

    const txHash = await client.writeContract({
        address: CODE_AUDITOR_CONTRACT_ADDRESS,
        functionName: "ask_anything",
        args: [sourceCode],
        value: 0n
    });

    // Safely wait for transaction receipt with fallback casting
    await (client as any).waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.ACCEPTED,
        retries: 100,
        interval: 5000
    });

    const latest = await readLatestAudit();
    return latest || "Audit completed, but no audit report was returned.";
}