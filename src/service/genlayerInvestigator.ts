// src/service/genlayerInvestigator.ts

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ensureGenLayerNetwork } from "./genlayerSniper";

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

export async function readLastAnalysis(): Promise<string> {
    const client = getReadClient();
    try {
        const result = await client.readContract({
            address: INVESTIGATOR_CONTRACT_ADDRESS,
            functionName: "get_last_analysis",
            args: []
        });
        return String(result ?? "");
    } catch {
        return "";
    }
}

/**
 * Conducts investigations using a live transaction status listener/polling system.
 * As soon as the transaction status reaches the 'Proposing' phase (or the state changes),
 * the text is displayed immediately without waiting for Accepted/Finalized.
 */
export async function investigateUrl(
    connectedAddress: string,
    targetUrl: string,
    onStatusUpdate?: (status: string, partialAnswer?: string) => void
): Promise<string> {

    await ensureGenLayerNetwork();
    const client = getWriteClient(connectedAddress);

    if (onStatusUpdate) onStatusUpdate("Broadcasting transaction...", "");

    // 1. Send the write transaction
    const txHash = await client.writeContract({
        address: INVESTIGATOR_CONTRACT_ADDRESS,
        functionName: "investigate_and_create_content",
        args: [targetUrl],
        value: 0n
    });

    console.log("Tx Hash:", txHash);
    if (onStatusUpdate) onStatusUpdate("Transaction sent. Waiting for Proposing phase...", "");

    const oldAnalysis = await readLastAnalysis();
    let maxAttempts = 120; // Max 6 minutes (3 seconds per check)
    let attempts = 0;
    let proposerReached = false;

    // 2. Loop listener / polling transaction status & contract state
    while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        attempts++;

        try {
            // Check receipt / transaction status from GenLayer node
            // Note: GenLayer SDK status property names are usually strings like 'pending', 'proposing', 'committing', 'accepted'
            const receipt: any = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
            
            const currentStatus = receipt?.status ? String(receipt.status).toLowerCase() : "pending";
            console.log(`Current GenLayer Tx Status: ${currentStatus}`);

            // Check contract contents in parallel
            const currentAnalysis = await readLastAnalysis();
            const hasNewContent = currentAnalysis && currentAnalysis.trim().length > 10 && currentAnalysis !== oldAnalysis;

            // MANDATORY TO DISPLAY THE ANSWER WHEN IN PROPOSING STATUS OR WHEN CONTRACT DATA IS ALREADY AVAILABLE IN THE EARLY PHASE
            if (currentStatus.includes("proposing") || currentStatus.includes("committing") || hasNewContent) {
                if (!proposerReached) {
                    proposerReached = true;
                    console.log("Proposing phase reached! Extracting AI answer immediately.");
                }

                if (hasNewContent) {
                    if (onStatusUpdate) onStatusUpdate(`Status: ${currentStatus.toUpperCase()} - AI Answer Generated!`, currentAnalysis);
                    return currentAnalysis;
                } else {
                    if (onStatusUpdate) onStatusUpdate(`Status: ${currentStatus.toUpperCase()} (Waiting for AI output data...)`, "");
                }
            } else {
                if (onStatusUpdate) onStatusUpdate(`Status: ${currentStatus.toUpperCase()}...`, "");
            }

            // If it turns out to be Accepted or completely successful
            if (currentStatus.includes("accepted") || currentStatus.includes("success")) {
                if (currentAnalysis && currentAnalysis !== oldAnalysis) {
                    return currentAnalysis;
                }
            }

        } catch (err) {
            // Fallback: If the getTransactionReceipt method is not yet fully supported by the SDK version, still monitor contract state changes
            const currentAnalysis = await readLastAnalysis();
            if (currentAnalysis && currentAnalysis.trim().length > 10 && currentAnalysis !== oldAnalysis) {
                if (onStatusUpdate) onStatusUpdate("Status: PROPOSING (Detected via State Update)", currentAnalysis);
                return currentAnalysis;
            }
            console.warn("Polling transaction status warning:", err);
        }
    }

    // Final fallback
    const finalFallback = await readLastAnalysis();
    return finalFallback || "Timeout waiting for investigation results.";
}