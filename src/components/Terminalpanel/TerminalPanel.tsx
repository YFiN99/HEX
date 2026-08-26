import "./TerminalPanel.css";

import { useEffect, useRef, useState } from "react";

type Props = {
    /** Baris-baris status yang "diketik" satu per satu, mensimulasikan proses */
    lines: string[];
    /** Ditampilkan setelah semua `lines` selesai "diketik" */
    finalOutput?: string;
    /** true selagi proses sungguhan masih berjalan di background */
    running: boolean;
    /** Judul kecil di title bar terminal */
    title?: string;
};

export default function TerminalPanel({
    lines,
    finalOutput,
    running,
    title = "genlayer://sniper"
}: Props) {

    const [visibleLines, setVisibleLines] = useState<string[]>([]);
    const [showFinal, setShowFinal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Ketik baris satu-satu dengan jeda, mensimulasikan proses live.
    useEffect(() => {

        setVisibleLines([]);
        setShowFinal(false);

        if (lines.length === 0) return;

        let index = 0;
        let cancelled = false;

        function typeNext() {

            if (cancelled) return;

            index += 1;

            setVisibleLines(
                lines.slice(0, index)
            );

            if (index < lines.length) {
                setTimeout(typeNext, 260 + Math.random() * 280);
            }
        }

        typeNext();

        return () => {
            cancelled = true;
        };

    }, [lines]);

    // Tampilkan hasil akhir setelah semua baris selesai DAN proses
    // sungguhan sudah tidak berjalan lagi.
    useEffect(() => {

        if (
            visibleLines.length === lines.length &&
            lines.length > 0 &&
            !running &&
            finalOutput
        ) {
            const timer = setTimeout(() => setShowFinal(true), 300);
            return () => clearTimeout(timer);
        }

    }, [visibleLines, lines, running, finalOutput]);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight
        });
    }, [visibleLines, showFinal]);

    return (
        <div className="terminalPanel">

            <div className="terminalTitleBar">
                <div className="terminalDots">
                    <span className="dot dotRed" />
                    <span className="dot dotYellow" />
                    <span className="dot dotGreen" />
                </div>
                <span className="terminalTitleText">{title}</span>
            </div>

            <div className="terminalBody" ref={scrollRef}>

                {visibleLines.map((line, index) => (
                    <div className="terminalLine" key={index}>
                        <span className="terminalPrompt">&gt;</span> {line}
                    </div>
                ))}

                {showFinal && finalOutput && (
                    <div className="terminalFinalOutput">
                        {finalOutput}
                    </div>
                )}

                {(running || (!showFinal && lines.length > 0)) && (
                    <span className="terminalCursor" />
                )}

            </div>

        </div>
    );
}