// src/service/askGlobal.ts

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { ensureGenLayerNetwork } from "./justice";

export const ASKGLOBAL_CONTRACT_ADDRESS =
    "0xd67e8388BC099FEacE26Dec23D35112AEc7fA463";

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
 * Riwayat mentah percakapan milik satu address, formatnya:
 * "User: ...\nAI: ...\n\nUser: ...\nAI: ..."
 * (persis format yang disimpan contract di user_histories[sender])
 */
export async function getUserHistory(userAddress: string): Promise<string> {
    const client = getReadClient();
    try {
        const result = await client.readContract({
            address: ASKGLOBAL_CONTRACT_ADDRESS,
            functionName: "get_user_history",
            args: [userAddress],
            stateStatus: "accepted"
        });
        return String(result ?? "");
    } catch (err) {
        console.error("getUserHistory failed:", err);
        return "";
    }
}

export async function getUserInteractionCount(userAddress: string): Promise<number> {
    const client = getReadClient();
    try {
        const result = await client.readContract({
            address: ASKGLOBAL_CONTRACT_ADDRESS,
            functionName: "get_user_interaction_count",
            args: [userAddress],
            stateStatus: "accepted"
        });
        return Number(result ?? 0);
    } catch {
        return 0;
    }
}

/**
 * Coba ambil "usulan" jawaban dari leader/validator 1 lewat getTransaction
 * -- ini RPC standar (bukan debugTraceTransaction yang gak didukung Studio
 * ini). Karena bentuk data persis dari SDK ini belum pasti, daripada
 * nebak nama field satu-satu, function ini nyisir SELURUH object tx
 * secara rekursif dan nyari string apapun yang "keliatan kayak jawaban
 * AI beneran" (panjang, isinya kalimat wajar) -- jadi gak bergantung ke
 * bentuk struktur data yang pasti.
 */
function looksLikeRealAnswer(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.length < 15) return false;

    // Buang kandidat yang keliatan kayak hash/alamat/hex/angka doang
    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return false;
    if (/^[0-9a-fA-F-]+$/.test(trimmed)) return false;

    // Harus ada spasi (kalimat beneran biasanya multi-kata)
    if (!trimmed.includes(" ")) return false;

    // Buang kalau ini calldata/JSON metadata transaksi (input args,
    // nama method, dsb) -- bukan hasil eksekusi/jawaban AI
    if (/"(method|args|function_name|functionName)"\s*:/i.test(trimmed)) return false;
    if (trimmed.startsWith("{") && trimmed.includes('"')) return false;

    return true;
}

function findBestStringInObject(
    obj: unknown,
    excludeText: string,
    depth = 0,
    seen = new Set<unknown>()
): string | null {
    if (depth > 6 || obj === null || obj === undefined) return null;

    if (typeof obj === "string") {
        const trimmed = obj.trim();
        const cleanExclude = excludeText.trim();
        if (trimmed === cleanExclude) return null; // itu input query-nya sendiri
        if (cleanExclude.length > 5 && trimmed.includes(cleanExclude)) return null; // query nyempil di dalam calldata/JSON
        return looksLikeRealAnswer(trimmed) ? trimmed : null;
    }

    if (typeof obj !== "object") return null;
    if (seen.has(obj)) return null;
    seen.add(obj);

    let best: string | null = null;

    const entries = Array.isArray(obj) ? obj.entries() : Object.entries(obj as Record<string, unknown>);
    for (const [, value] of entries as IterableIterator<[unknown, unknown]>) {
        const found = findBestStringInObject(value, excludeText, depth + 1, seen);
        if (found && (!best || found.length > best.length)) {
            best = found;
        }
    }

    return best;
}

function extractPreviewText(tx: any, originalQuery: string): string | null {
    if (!tx) return null;

    const found = findBestStringInObject(tx, originalQuery);
    if (!found) {
        console.log("askGlobal preview: belum ketemu string yang cocok, raw tx:", tx);
    }
    return found;
}

/**
 * Polling getTransaction di background (gak nge-block alur utama) buat
 * nangkep usulan jawaban leader secepat mungkin. Begitu ketemu satu kali,
 * berhenti -- jawaban FINAL tetep nunggu proses utama di askAnything().
 */
async function pollForPreview(
    txHash: string,
    query: string,
    onPreview: (text: string) => void
) {
    const client = getReadClient();

    for (let i = 0; i < 40; i++) {
        try {
            const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
            const preview = extractPreviewText(tx, query);
            if (preview) {
                onPreview(preview);
                return;
            }
        } catch {
            // tx belum ke-index / belum siap, coba lagi
        }

        await new Promise(r => setTimeout(r, 2000));
    }
}

export interface ChatMessage {
    role: "user" | "ai";
    text: string;
}

/**
 * Parse string riwayat mentah dari contract jadi array pesan chat,
 * berdasarkan format "User: ...\nAI: ..." yang dipisah "\n\n".
 */
export function parseHistory(raw: string): ChatMessage[] {
    if (!raw || !raw.trim()) return [];

    const messages: ChatMessage[] = [];
    const turns = raw.split("\n\nUser: ");

    turns.forEach((turn, i) => {
        const chunk = i === 0 ? turn.replace(/^User: /, "") : turn;
        const aiSplitIndex = chunk.indexOf("\nAI: ");

        if (aiSplitIndex === -1) {
            if (chunk.trim()) {
                messages.push({ role: "user", text: chunk.trim() });
            }
            return;
        }

        const userText = chunk.slice(0, aiSplitIndex).trim();
        const aiText = chunk.slice(aiSplitIndex + 5).trim();

        if (userText) messages.push({ role: "user", text: userText });
        if (aiText) messages.push({ role: "ai", text: aiText });
    });

    return messages;
}

export const PENDING_TIMEOUT_MESSAGE =
    "Still waiting for the network to confirm this response — it may just take a bit longer than usual. Try reopening the chat in a moment; your answer will be there once it's saved on-chain.";

/**
 * Dipanggil UI setelah askAnything() balikin PENDING_TIMEOUT_MESSAGE.
 * Lanjut ngecek get_user_history di background (interval lebih santai)
 * sampai jawabannya beneran ketemu, tanpa perlu user manual reload.
 * Return null kalau tetep belum ketemu setelah semua percobaan habis.
 */
export async function pollForAnswer(
    connectedAddress: string,
    historyBefore: string,
    opts?: { maxAttempts?: number; intervalMs?: number }
): Promise<string | null> {
    const maxAttempts = opts?.maxAttempts ?? 20;
    const intervalMs = opts?.intervalMs ?? 5000;

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, intervalMs));

        const history = await getUserHistory(connectedAddress);
        if (history !== historyBefore && history.length > historyBefore.length) {
            const messages = parseHistory(history);
            const lastAi = [...messages].reverse().find(m => m.role === "ai");
            if (lastAi?.text) return lastAi.text;
        }
    }

    return null;
}

/**
 * Kirim pertanyaan baru, tunggu transaksi selesai, lalu polling
 * get_user_history sampai riwayatnya bertambah (jawaban AI-nya masuk).
 * Return jawaban AI yang baru saja dihasilkan.
 */
export async function askAnything(
    connectedAddress: string,
    query: string,
    onStatusUpdate?: (status: string) => void,
    onPreview?: (text: string) => void
): Promise<string> {
    await ensureGenLayerNetwork();
    const client = getWriteClient(connectedAddress);

    const historyBefore = await getUserHistory(connectedAddress);

    if (onStatusUpdate) onStatusUpdate("Sending...");

    const txHash = await client.writeContract({
        address: ASKGLOBAL_CONTRACT_ADDRESS,
        functionName: "ask_anything",
        args: [query],
        value: 0n
    });

    // Jalan paralel di background -- gak di-await, gak nge-block alur
    // utama. Kalau ketemu, tampilin sebagai preview/draft di UI; kalau
    // enggak, gak ngaruh apa-apa ke alur utama di bawah.
    if (onPreview) {
        pollForPreview(txHash, query, onPreview);
    }

    if (onStatusUpdate) onStatusUpdate("Waiting for consensus...");

    // Nunggu tx ACCEPTED itu best-effort doang -- kalau ini timeout,
    // JANGAN nyerah. Tx-nya kemungkinan besar tetep bakal sukses cuma
    // butuh waktu lebih lama, jadi kita tetep lanjut ke loop polling
    // di bawah apapun hasilnya.
    try {
        await client.waitForTransactionReceipt({
            hash: txHash,
            status: TransactionStatus.ACCEPTED,
            retries: 150,
            interval: 4000
        });
    } catch (err) {
        console.error("waitForTransactionReceipt timed out, continuing to poll anyway:", err);
    }

    // Satu loop tunggu yang panjang & sabar -- BUKAN "nyerah dulu,
    // ganti belakangan". Selama loop ini masih jalan, UI tetap dalam
    // state loading (timer digital tetep jalan), dan baru selesai
    // begitu jawaban aslinya beneran ketemu. Total sampai ~8 menit,
    // karena consensus GenLayer kadang butuh waktu segitu (leader
    // rotation dll).
    let historyAfter = historyBefore;
    const maxAttempts = 160;
    const intervalMs = 3000;

    for (let i = 0; i < maxAttempts; i++) {
        historyAfter = await getUserHistory(connectedAddress);
        if (historyAfter !== historyBefore && historyAfter.length > historyBefore.length) {
            break;
        }

        if (onStatusUpdate) {
            const elapsed = Math.round((i + 1) * intervalMs / 1000);
            onStatusUpdate(`Waiting for the network to finalize your answer... (${elapsed}s)`);
        }

        await new Promise(r => setTimeout(r, intervalMs));
    }

    const timedOut = historyAfter === historyBefore || historyAfter.length <= historyBefore.length;

    if (timedOut) {
        // Ini beneran cuma kejadian kalau jaringan macet total (>8 menit).
        return PENDING_TIMEOUT_MESSAGE;
    }

    const messages = parseHistory(historyAfter);
    const lastAi = [...messages].reverse().find(m => m.role === "ai");

    return lastAi?.text || "";
}