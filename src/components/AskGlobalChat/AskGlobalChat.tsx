import "./AskGlobalChat.css";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { useWallet } from "../../context/WalletContext";
import {
    askAnything,
    getUserHistory,
    parseHistory
} from "../../service/askGlobal";
import type { ChatMessage } from "../../service/askGlobal";

function formatElapsed(ms: number): string {
    const totalCentis = Math.floor(ms / 10);
    const minutes = Math.floor(totalCentis / 6000);
    const seconds = Math.floor((totalCentis % 6000) / 100);
    const centis = totalCentis % 100;

    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    const cc = String(centis).padStart(2, "0");

    return `${mm}:${ss}.${cc}`;
}

export default function AskGlobalChat() {
    const { address, connected } = useWallet();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [elapsedMs, setElapsedMs] = useState(0);
    const [previewText, setPreviewText] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // =====================================================
    // MUAT RIWAYAT LAMA SETIAP WALLET CONNECT / GANTI ADDRESS
    // Ini yang bikin percakapan "nggak putus" -- histori-nya
    // kesimpen di on-chain per wallet address, jadi kebuka lagi
    // persis walau reload halaman atau ganti device.
    // =====================================================
    useEffect(() => {
        if (!connected || !address) {
            setMessages([]);
            return;
        }

        let cancelled = false;

        (async () => {
            setLoadingHistory(true);
            const raw = await getUserHistory(address);
            if (!cancelled) {
                setMessages(parseHistory(raw));
                setLoadingHistory(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [connected, address]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth"
        });
    }, [messages, loading]);

    async function handleSend() {
        const query = input.trim();
        if (!query || loading) return;

        if (!connected || !address) {
            setError("Connect your wallet first to chat.");
            return;
        }

        setError("");
        setInput("");
        setLoading(true);
        setElapsedMs(0);
        setPreviewText("");

        const startedAt = Date.now();
        timerRef.current = setInterval(() => {
            setElapsedMs(Date.now() - startedAt);
        }, 40);

        // Tampilkan pesan user langsung (optimistic), AI masih "typing"
        setMessages(prev => [...prev, { role: "user", text: query }]);

        try {
            const answer = await askAnything(address, query, setStatus, setPreviewText);
            setMessages(prev => [...prev, { role: "ai", text: answer || "(no response)" }]);
        } catch (err) {
            console.error("askAnything error:", err);
            setError(err instanceof Error ? err.message : "Failed to get a response.");
        } finally {
            setLoading(false);
            setStatus("");
            setPreviewText("");
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="askglobal-wrapper">
            <div className="askglobal-card">

                <div className="askglobal-header">
                    <h2>AI Assistant</h2>
                    <span className="askglobal-subtitle">
                        On-chain memory · continues across sessions
                    </span>
                </div>

                <div className="askglobal-messages" ref={scrollRef}>
                    {!connected && (
                        <div className="askglobal-empty">
                            Connect your wallet to start chatting.
                        </div>
                    )}

                    {connected && loadingHistory && (
                        <div className="askglobal-empty">
                            Loading your conversation history...
                        </div>
                    )}

                    {connected && !loadingHistory && messages.length === 0 && (
                        <div className="askglobal-empty">
                            No messages yet — ask anything to get started.
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={
                                "askglobal-bubble " +
                                (m.role === "user" ? "askglobal-user" : "askglobal-ai")
                            }
                        >
                            {m.text}
                        </div>
                    ))}

                    {loading && previewText && (
                        <div className="askglobal-bubble askglobal-ai askglobal-preview">
                            <span className="askglobal-preview-label">
                                Preview from validator 1 · not final yet
                            </span>
                            {previewText}
                        </div>
                    )}

                    {loading && (
                        <div className="askglobal-bubble askglobal-ai askglobal-typing">
                            <div className="askglobal-typing-dots">
                                <span className="askglobal-dot" />
                                <span className="askglobal-dot" />
                                <span className="askglobal-dot" />
                            </div>
                            <span className="askglobal-timer">
                                {formatElapsed(elapsedMs)}
                            </span>
                            {status && (
                                <span className="askglobal-status">{status}</span>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="askglobal-error">{error}</div>
                )}

                <div className="askglobal-input-row">
                    <textarea
                        className="askglobal-input"
                        placeholder={
                            connected
                                ? "Ask anything..."
                                : "Connect your wallet to chat"
                        }
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!connected || loading}
                        rows={1}
                    />
                    <button
                        className="askglobal-send"
                        onClick={handleSend}
                        disabled={!connected || loading || !input.trim()}
                    >
                        <Send size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
}