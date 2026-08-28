import "./TerminalPanel.css";

import { useEffect, useRef, useState } from "react";

type Props = {
    /** Status lines typed one by one, simulating the process */
    lines: string[];
    /** Displayed after all `lines` finish typing */
    finalOutput?: string;
    /** True while the actual process is still running in the background */
    running: boolean;
    /** Small title in the terminal title bar */
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

    // Type lines one by one with a delay to simulate a live process.
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

    // FREE FROM RUNNING BLOCK:
    // As soon as finalOutput has content (AI result received during Proposing),
    // display it immediately without waiting for running to become false!
    useEffect(() => {
        if (finalOutput && finalOutput.trim().length > 0) {
            setShowFinal(true);
        }
    }, [finalOutput]);

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

                {(running && !showFinal) && (
                    <span className="terminalCursor" />
                )}

            </div>

        </div>
    );
}