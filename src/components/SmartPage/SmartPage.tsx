// src/components/SmartPage.tsx

import "./SmartPage.css";

import { useState } from "react";
import { Sparkles, Crosshair, Send, Code2 } from "lucide-react";

import TerminalPanel from "../Terminalpanel/TerminalPanel";

import { useWallet } from "../../context/WalletContext";
import { triggerScan, SNIPER_CONTRACT_ADDRESS } from "../../service/genlayerSniper";
import { investigateUrl, readLastAnalysis, INVESTIGATOR_CONTRACT_ADDRESS } from "../../service/genlayerInvestigator";
import { auditCode, CODE_AUDITOR_CONTRACT_ADDRESS } from "../../service/genlayerCodeAuditor";

type Tool = "sniper" | "post" | "coding" | null;

export default function SmartPage() {

    const { address, connected } = useWallet();

    const [activeTool, setActiveTool] = useState<Tool>(null);
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    const [showSniperInput, setShowSniperInput] = useState(false);
    const [sniperTag, setSniperTag] = useState("");

    const [showUrlInput, setShowUrlInput] = useState(false);
    const [targetUrl, setTargetUrl] = useState("");

    const [showCodeInput, setShowCodeInput] = useState(false);
    const [sourceCode, setSourceCode] = useState("");

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

    function openSniperInput() {
        setActiveTool(null);
        setShowUrlInput(false);
        setShowCodeInput(false);
        setOutput("");
        setError("");
        setShowSniperInput(prev => !prev);
    }

    async function runSniper() {
        if (!connected || !address) {
            setError("Please connect your wallet first to run Sniper.");
            return;
        }

        const tagToUse = sniperTag.trim() || "Top GitHub blockchain repositories";

        setActiveTool("sniper");
        setShowSniperInput(false);
        setOutput("");
        setError("");
        setRunning(true);

        const requestId = crypto.randomUUID();

        const baseSteps = [
            "Connecting to GenLayer Studio node...",
            `Resolving contract ${SNIPER_CONTRACT_ADDRESS.slice(0, 10)}...`,
            `Scanning with target tag: "${tagToUse}"...`
        ];

        try {
            const txPromise = triggerScan(address, requestId, tagToUse);
            trackTransactionProgress(txPromise, baseSteps);

            const result = await txPromise;
            setOutput(String(result || "No results found."));
        } catch (err) {
            console.error("Sniper error:", err);
            setError(err instanceof Error ? err.message : "Sniper execution failed.");
        } finally {
            setRunning(false);
        }
    }

    function openPostInput() {
        setActiveTool(null);
        setShowSniperInput(false);
        setShowCodeInput(false);
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

    function openCodeInput() {
        setActiveTool(null);
        setShowSniperInput(false);
        setShowUrlInput(false);
        setOutput("");
        setError("");
        setShowCodeInput(true);
    }

    async function runCoding() {
        if (!connected || !address) {
            setError("Please connect your wallet first to run Coding.");
            return;
        }

        const code = sourceCode.trim();
        if (!code) {
            setError("Please paste or write source code first.");
            return;
        }

        setActiveTool("coding");
        setShowCodeInput(false);
        setOutput("");
        setError("");
        setRunning(true);

        const baseSteps = [
            "Connecting to GenLayer Studio node...",
            `Resolving contract ${CODE_AUDITOR_CONTRACT_ADDRESS.slice(0, 10)}...`,
            "Parsing source code for GenVM multi-language reasoning..."
        ];

        try {
            const txPromise = auditCode(address, code);
            trackTransactionProgress(txPromise, baseSteps);

            const result = await txPromise;
            setOutput(String(result || "No audit results found."));
        } catch (err) {
            console.error("Coding error:", err);
            setError(err instanceof Error ? err.message : "Code audit execution failed.");
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
                    Autonomously investigate alpha projects, content, & code
                </p>

                <div className="smart-tool-buttons smart-tool-buttons-3">
                    <button
                        className="smart-tool-button"
                        onClick={openSniperInput}
                        disabled={running}
                    >
                        <Crosshair size={16} />
                        Sniper
                    </button>

                    <button
                        className="smart-tool-button"
                        onClick={openPostInput}
                        disabled={running}
                    >
                        <Send size={16} />
                        Post
                    </button>

                    <button
                        className="smart-tool-button"
                        onClick={openCodeInput}
                        disabled={running}
                    >
                        <Code2 size={16} />
                        Coding
                    </button>
                </div>

                {showSniperInput && (
                    <div className="smart-url-input-row">
                        <input
                            type="text"
                            className="smart-url-input"
                            placeholder="Optional Tag / Keyword (e.g. DeFi, AI, L2)..."
                            value={sniperTag}
                            onChange={e => setSniperTag(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter") runSniper();
                            }}
                        />
                        <button
                            className="smart-url-submit"
                            onClick={runSniper}
                            disabled={running}
                        >
                            Scan
                        </button>
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

                {showCodeInput && (
                    <div className="smart-code-input-block">
                        <textarea
                            className="smart-code-textarea"
                            placeholder="Paste source code here (Solidity, Python, JS, Rust, etc.)..."
                            value={sourceCode}
                            onChange={e => setSourceCode(e.target.value)}
                            rows={8}
                            spellCheck={false}
                        />
                        <button
                            className="smart-url-submit smart-code-submit"
                            onClick={runCoding}
                            disabled={running}
                        >
                            Audit Code
                        </button>
                    </div>
                )}

                {activeTool && (
                    <TerminalPanel
                        title={
                            activeTool === "sniper"
                                ? "genlayer://sniper"
                                : activeTool === "post"
                                ? "genlayer://post"
                                : "genlayer://audit"
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