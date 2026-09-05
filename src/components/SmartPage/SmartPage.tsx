import "./SmartPage.css";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Scale, Send, Search, Loader2 } from "lucide-react";

import TerminalPanel from "../Terminalpanel/TerminalPanel";

import { useWallet } from "../../context/WalletContext";
import { autoExecuteJusticeScan, JUSTICE_CONTRACT_ADDRESS } from "../../service/justice";
import { investigateUrl, readLastAnalysis, INVESTIGATOR_CONTRACT_ADDRESS } from "../../service/genlayerInvestigator";

type Tool = "justice" | "post" | null;

interface TokenSuggestion {
    symbol: string;
    name: string;
    address: string;
    chain: string;
}

export default function SmartPage() {

    const { address, connected } = useWallet();

    const [activeTool, setActiveTool] = useState<Tool>(null);
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    const [showJusticeInput, setShowJusticeInput] = useState(false);
    const [justiceTarget, setJusticeTarget] = useState("");
    
    // State untuk Auto-Suggest Dropdown
    const [suggestions, setSuggestions] = useState<TokenSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [showUrlInput, setShowUrlInput] = useState(false);
    const [targetUrl, setTargetUrl] = useState("");

    // Effect untuk Fetch Auto-Suggest saat User Mengetik
    useEffect(() => {
        const query = justiceTarget.trim();
        if (query.length < 2 || query.startsWith("0x")) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoadingSuggestions(true);
            try {
                const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data && data.pairs) {
                    const list: TokenSuggestion[] = data.pairs.slice(0, 5).map((pair: any) => ({
                        symbol: pair.baseToken.symbol,
                        name: pair.baseToken.name,
                        address: pair.baseToken.address,
                        chain: pair.chainId
                    }));
                    setSuggestions(list);
                    setShowDropdown(true);
                }
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 300); // Debounce 300ms

        return () => clearTimeout(timer);
    }, [justiceTarget]);

    // Close dropdown jika klik di luar input
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function trackTransactionProgress(txPromise: Promise<any>, initialSteps: string[]) {
        const steps = [...initialSteps];
        setTerminalLines(steps);

        const stages = [
            "Pending transaction broadcasted...",
            "Validators Proposing state...",
            "Validators Committing votes...",
            "Revealing consensus data...",
            "Accepted by network",
            "Finalized successfully"
        ];

        for (const stage of stages) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            steps.push(`> ${stage}`);
            setTerminalLines([...steps]);
        }
    }

    function openJusticeInput() {
        setActiveTool(null);
        setShowUrlInput(false);
        setOutput("");
        setError("");
        setShowJusticeInput(prev => !prev);
    }

    async function runJusticeScan(overrideTarget?: string) {
        if (!connected || !address) {
            setError("Please connect your wallet first to run Onchain Justice Scan.");
            return;
        }

        const targetToUse = (overrideTarget || justiceTarget).trim() || "0x6B175474E89094C44Da98b954EedeAC495271d0F";
        
        setShowDropdown(false);
        setActiveTool("justice");
        setShowJusticeInput(false);
        setOutput("");
        setError("");
        setRunning(true);

        const baseSteps = [
            "Connecting to GenLayer Studio node...",
            `Resolving contract ${JUSTICE_CONTRACT_ADDRESS.slice(0, 10)}...`,
            `Auditing target token/link: "${targetToUse}"...`
        ];

        try {
            const scanPromise = autoExecuteJusticeScan(
                address, 
                targetToUse, 
                "DEX_SCREENER",
                (statusMsg) => {
                    setTerminalLines(prev => [...prev, `> ${statusMsg}`]);
                }
            );

            trackTransactionProgress(scanPromise, baseSteps);

            const res = await scanPromise;
            if (res.success) {
                setOutput(String(res.result || "Audit complete with no errors."));
            } else {
                setError(res.result || "Justice scan failed.");
            }
        } catch (err) {
            console.error("Justice error:", err);
            setError(err instanceof Error ? err.message : "Justice scan execution failed.");
        } finally {
            setRunning(false);
        }
    }

    function openPostInput() {
        setActiveTool(null);
        setShowJusticeInput(false);
        setOutput("");
        setError("");
        setShowUrlInput(true);
    }

    async function runPost() {
        if (!connected || !address) {
            setError("Please connect your wallet first to run Post.");
            return;
        }

        const url = targetUrl.trim();
        if (!url) {
            setError("Please enter a target URL first.");
            return;
        }

        setActiveTool("post");
        setShowUrlInput(false);
        setOutput("");
        setError("");
        setRunning(true);

        const baseSteps = [
            "Connecting to GenLayer Studio node...",
            `Resolving contract ${INVESTIGATOR_CONTRACT_ADDRESS.slice(0, 10)}...`,
            `Fetching target page: ${url}`
        ];

        async function pollForOutput(
            readFn: () => Promise<string>,
            oldValue: string,
            maxRetries = 60,
            intervalMs = 1000
        ): Promise<string> {
            let attempts = 0;
            while (attempts < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, intervalMs));
                attempts++;
                try {
                    const currentVal = await readFn();
                    if (currentVal && currentVal.trim().length > 10 && currentVal !== oldValue) {
                        return currentVal;
                    }
                } catch (err) {
                    // Ignore silent error
                }
            }
            return await readFn();
        }

        try {
            const oldAnalysis = await readLastAnalysis();
            const txPromise = investigateUrl(address, url);
            
            trackTransactionProgress(txPromise, baseSteps);

            const resultPromise = pollForOutput(readLastAnalysis, oldAnalysis);
            const result = await Promise.race([
                resultPromise,
                txPromise.catch(() => readLastAnalysis())
            ]);

            setOutput(String(result || "No investigation results found."));
        } catch (err) {
            console.error("Post error:", err);
            setError(err instanceof Error ? err.message : "Post execution failed.");
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="smart-wrapper">
            <div className="smart-card">
                <div className="smart-header">
                    <div className="smart-title">
                        <Sparkles size={18} />
                        <h2>Smart Radar</h2>
                    </div>
                </div>

                <p className="smart-subtitle">
                    Autonomously investigate alpha projects & content
                </p>

                <div className="smart-tool-buttons">
                    <button
                        className="smart-tool-button"
                        onClick={openJusticeInput}
                        disabled={running}
                    >
                        <Scale size={16} />
                        Justice Audit
                    </button>

                    <button
                        className="smart-tool-button"
                        onClick={openPostInput}
                        disabled={running}
                    >
                        <Send size={16} />
                        Post
                    </button>
                </div>

                {showJusticeInput && (
                    <div className="smart-url-input-container" ref={dropdownRef} style={{ position: "relative" }}>
                        <div className="smart-url-input-row">
                            <input
                                type="text"
                                className="smart-url-input"
                                placeholder="Search token (e.g. dai, bonk) or paste address..."
                                value={justiceTarget}
                                onChange={e => setJusticeTarget(e.target.value)}
                                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") runJusticeScan();
                                }}
                            />
                            <button
                                className="smart-url-submit"
                                onClick={() => runJusticeScan()}
                                disabled={running}
                            >
                                {loadingSuggestions ? <Loader2 size={16} className="animate-spin" /> : "Scan"}
                            </button>
                        </div>

                        {/* Dropdown Auto-Suggest Hasil Pencarian */}
                        {showDropdown && suggestions.length > 0 && (
                            <div className="smart-dropdown-list" style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 50,
                                backgroundColor: "#121824",
                                border: "1px solid #1e293b",
                                borderRadius: "8px",
                                marginTop: "4px",
                                overflow: "hidden",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                            }}>
                                {suggestions.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setJusticeTarget(item.address);
                                            runJusticeScan(item.address);
                                        }}
                                        style={{
                                            padding: "10px 14px",
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            borderBottom: idx < suggestions.length - 1 ? "1px solid #1e293b" : "none",
                                            transition: "background-color 0.2s"
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        <div>
                                            <span style={{ fontWeight: "bold", color: "#38bdf8", marginRight: "8px" }}>
                                                ${item.symbol}
                                            </span>
                                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{item.name}</span>
                                        </div>
                                        <span style={{
                                            fontSize: "10px",
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            backgroundColor: "#0f172a",
                                            color: "#cbd5e1",
                                            textTransform: "uppercase"
                                        }}>
                                            {item.chain}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {showUrlInput && (
                    <div className="smart-url-input-row">
                        <input
                            type="text"
                            className="smart-url-input"
                            placeholder="https://example-project.com"
                            value={targetUrl}
                            onChange={e => setTargetUrl(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter") runPost();
                            }}
                        />
                        <button
                            className="smart-url-submit"
                            onClick={runPost}
                            disabled={running}
                        >
                            Run
                        </button>
                    </div>
                )}

                {activeTool && (
                    <TerminalPanel
                        title={
                            activeTool === "justice"
                                ? "genlayer://justice"
                                : "genlayer://post"
                        }
                        lines={terminalLines}
                        finalOutput={output}
                        running={running}
                    />
                )}

                {error && (
                    <div className="smart-error">
                        {error}
                    </div>
                )}

                <div className="smart-footnote" translate="no">
                    Powered by GenLayer Intelligent Contract
                </div>
            </div>
        </div>
    );
}