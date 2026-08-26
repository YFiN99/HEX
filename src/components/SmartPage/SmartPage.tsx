import "./SmartPage.css";

import { useState } from "react";
import { Sparkles, Crosshair, Send, Code2 } from "lucide-react";

import TerminalPanel from "../Terminalpanel/TerminalPanel";

import { useWallet } from "../../context/WalletContext";
import { triggerScan } from "../../service/genlayerSniper";
import { investigateUrl } from "../../service/genlayerInvestigator";
import { auditCode } from "../../service/genlayerCodeAuditor";

type Tool = "sniper" | "post" | "coding" | null;

const SNIPER_STEPS = [
    "Connecting to GenLayer Studio node...",
    "Resolving contract 0xa4E1dd961...1CbBF6A...",
    "Fetching GitHub search index (new repos)...",
    "Fetching DexScreener liquidity feed...",
    "Dispatching payload to consensus validators...",
    "Awaiting LLM analysis from GenVM...",
    "Waiting for FINALIZED status..."
];

function postSteps(url: string) {
    return [
        "Connecting to GenLayer Studio node...",
        "Resolving contract 0x8c35DFB6D...c21aC68Da...",
        `Fetching target page: ${url}`,
        "Extracting core value proposition...",
        "Dispatching payload to consensus validators...",
        "Validators scoring output against criteria...",
        "Waiting for FINALIZED status..."
    ];
}

const CODING_STEPS = [
    "Connecting to GenLayer Studio node...",
    "Resolving contract 0x6de3F5F0...6033C1...",
    "Parsing submitted source code...",
    "Running multi-language security analysis...",
    "Scoring vulnerabilities & code quality...",
    "Dispatching payload to consensus validators...",
    "Waiting for FINALIZED status..."
];

export default function SmartPage() {

    const { address, connected } = useWallet();

    const [activeTool, setActiveTool] = useState<Tool>(null);
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");

    const [showUrlInput, setShowUrlInput] = useState(false);
    const [targetUrl, setTargetUrl] = useState("");

    const [showCodeInput, setShowCodeInput] = useState(false);
    const [sourceCode, setSourceCode] = useState("");

    async function runSniper() {

        if (!connected || !address) {
            setError("Connect wallet dulu untuk menjalankan Sniper.");
            return;
        }

        setActiveTool("sniper");
        setShowUrlInput(false);
        setShowCodeInput(false);
        setOutput("");
        setError("");
        setRunning(true);

        try {

            const result = await triggerScan(address);
            setOutput(result);

        } catch (err) {

            console.error("Sniper error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Sniper gagal dijalankan."
            );

        } finally {

            setRunning(false);

        }

    }

    function openPostInput() {
        setActiveTool(null);
        setShowCodeInput(false);
        setOutput("");
        setError("");
        setShowUrlInput(true);
    }

    async function runPost() {

        if (!connected || !address) {
            setError("Connect wallet dulu untuk menjalankan Post.");
            return;
        }

        const url = targetUrl.trim();

        if (!url) {
            setError("Masukkan URL target dulu.");
            return;
        }

        setActiveTool("post");
        setShowUrlInput(false);
        setOutput("");
        setError("");
        setRunning(true);

        try {

            const result = await investigateUrl(address, url);
            setOutput(result);

        } catch (err) {

            console.error("Post error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Post gagal dijalankan."
            );

        } finally {

            setRunning(false);

        }

    }

    function openCodeInput() {
        setActiveTool(null);
        setShowUrlInput(false);
        setOutput("");
        setError("");
        setShowCodeInput(true);
    }

    async function runCoding() {

        if (!connected || !address) {
            setError("Connect wallet dulu untuk menjalankan Coding.");
            return;
        }

        const code = sourceCode.trim();

        if (!code) {
            setError("Tempel/tulis source code dulu.");
            return;
        }

        setActiveTool("coding");
        setShowCodeInput(false);
        setOutput("");
        setError("");
        setRunning(true);

        try {

            const result = await auditCode(address, code);
            setOutput(result);

        } catch (err) {

            console.error("Coding error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Audit code gagal dijalankan."
            );

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
                        onClick={runSniper}
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

                {showUrlInput && (
                    <div className="smart-url-input-row">

                        <input
                            type="text"
                            className="smart-url-input"
                            placeholder="https://contoh-proyek.com"
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
                            Jalankan
                        </button>

                    </div>
                )}

                {showCodeInput && (
                    <div className="smart-code-input-block">

                        <textarea
                            className="smart-code-textarea"
                            placeholder="Tempel source code di sini (Solidity, Python, JS, Rust, dll)..."
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
                        lines={
                            activeTool === "sniper"
                                ? SNIPER_STEPS
                                : activeTool === "post"
                                ? postSteps(targetUrl)
                                : CODING_STEPS
                        }
                        finalOutput={output}
                        running={running}
                    />
                )}

                {error && (
                    <div className="smart-error">
                        {error}
                    </div>
                )}

                <div className="smart-footnote">
                    Powered by GenLayer Intelligent Contract
                </div>

            </div>

        </div>
    );
}