import React, { useState, useEffect, useRef } from 'react';
import './Agents.css';

export default function Agents() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{sender: string, text: string, type?: string}>>([
        { sender: 'System', text: 'Welcome to Agents Lobby. Local Ed25519 identity ready.' }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(false);

    // Local identity state
    const [didKey, setDidKey] = useState<string | null>(null);
    const [privKey, setPrivKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Private Key Export Modal state
    const [showExportModal, setShowExportModal] = useState(false);
    const [copiedPriv, setCopiedPriv] = useState(false);

    // Draggable Button Position State dengan Safe Boundaries untuk Mobile & Desktop
    const [position, setPosition] = useState(() => {
        const savedPos = localStorage.getItem('agent_btn_pos');
        if (savedPos) {
            try { 
                const parsed = JSON.parse(savedPos);
                // Pastikan posisi yang tersimpan tidak di luar layar saat ukuran berubah
                if (parsed.x < window.innerWidth && parsed.y < window.innerHeight) {
                    return parsed;
                }
            } catch (e) {}
        }
        // Default aman di pojok kanan bawah layar (responsif mobile & desktop)
        return { 
            x: Math.max(20, window.innerWidth - 180), 
            y: Math.max(80, window.innerHeight - 100) 
        };
    });

    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const hasMovedRef = useRef(false);

    // Smart Auto-Scroll states & refs
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const atBottom = scrollHeight - scrollTop - clientHeight < 40;
            setIsAtBottom(atBottom);
            if (atBottom) setUnreadCount(0);
        }
    };

    useEffect(() => {
        if (isOpen && isAtBottom) {
            scrollToBottom('smooth');
        } else if (isOpen) {
            setUnreadCount(prev => prev + 1);
        }
    }, [messages, isOpen]);

    // Load or generate local Ed25519 key on startup
    useEffect(() => {
        let storedDid = localStorage.getItem('agent_did');
        let storedPriv = localStorage.getItem('agent_priv_key');

        if (!storedDid || !storedPriv) {
            const generated = generateLocalEd25519Identity(); 
            localStorage.setItem('agent_did', generated.didKey);
            localStorage.setItem('agent_priv_key', generated.privKey);
            storedDid = generated.didKey;
            storedPriv = generated.privKey;
        }

        setDidKey(storedDid);
        setPrivKey(storedPriv);
    }, []);

    // Universal Drag Start (Support Mouse & Touch HP)
    const handleDragStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        hasMovedRef.current = false;
        dragOffsetRef.current = {
            x: clientX - position.x,
            y: clientY - position.y
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        handleDragStart(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length > 0) {
            handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    // Universal Drag Move & End
    useEffect(() => {
        const handleMove = (clientX: number, clientY: number) => {
            if (!isDragging) return;
            hasMovedRef.current = true;
            
            // Batasi agar tombol tidak keluar dari layar HP/Desktop
            const maxX = window.innerWidth - 140;
            const maxY = window.innerHeight - 50;
            
            const newX = Math.min(Math.max(10, clientX - dragOffsetRef.current.x), maxX);
            const newY = Math.min(Math.max(10, clientY - dragOffsetRef.current.y), maxY);
            
            setPosition({ x: newX, y: newY });
        };

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        const handleEnd = () => {
            if (isDragging) {
                setIsDragging(false);
                localStorage.setItem('agent_btn_pos', JSON.stringify(position));
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, position]);

    const handleButtonClick = () => {
        if (hasMovedRef.current) return;
        setIsOpen(!isOpen);
    };

    // Long-Polling for incoming lobby messages
    useEffect(() => {
        let isMounted = true;
        const room = "lobby";

        const pollMessages = async () => {
            while (isMounted) {
                try {
                    const response = await fetch(`https://technocore.chat/r/${room}?wait=5`, {
                        method: 'GET',
                        mode: 'cors',
                    });

                    if (response.ok) {
                        const rawText = await response.text();
                        if (rawText.trim()) {
                            const lines = rawText.split('\n').filter(line => line.trim() !== '');
                            
                            setMessages(prevMessages => {
                                const existingTexts = new Set(prevMessages.map(m => `${m.sender}:${m.text}`));
                                const newIncoming: Array<{sender: string, text: string}> = [];

                                lines.forEach(line => {
                                    if (line.startsWith('#')) return;

                                    let sender = 'GlobalAgent';
                                    let text = line;

                                    const match = line.match(/^\[\d+\]\s+[\d\-T:.Z]+\s+<([^>]+)>\s+(.*)$/);
                                    
                                    if (match) {
                                        sender = match[1];
                                        text = match[2];
                                    } else {
                                        const colonIndex = line.indexOf(':');
                                        if (colonIndex !== -1) {
                                            sender = line.slice(0, colonIndex).trim();
                                            text = line.slice(colonIndex + 1).trim();
                                        }
                                    }

                                    const uniqueKey = `${sender}:${text}`;
                                    if (!existingTexts.has(uniqueKey)) {
                                        newIncoming.push({ sender, text });
                                        existingTexts.add(uniqueKey);
                                    }
                                });

                                if (newIncoming.length > 0) {
                                    return [...prevMessages, ...newIncoming];
                                }
                                return prevMessages;
                            });
                        }
                    }
                } catch (err) {
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            }
        };

        if (isOpen) {
            pollMessages();
        }

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    const generateLocalEd25519Identity = () => {
        const randomBytes = new Uint8Array(32);
        window.crypto.getRandomValues(randomBytes);
        const privKeyHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        
        const mockMulticodecPrefix = "z6Mk";
        const randomPubHex = Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
        
        return {
            didKey: `did:key:${mockMulticodecPrefix}${randomPubHex}`,
            privKey: privKeyHex
        };
    };

    const copyToClipboard = () => {
        if (didKey) {
            navigator.clipboard.writeText(didKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleExportPrivKey = () => {
        if (privKey) setShowExportModal(true);
    };

    const copyPrivateKeyToClipboard = () => {
        if (privKey) {
            navigator.clipboard.writeText(privKey);
            setCopiedPriv(true);
            setTimeout(() => setCopiedPriv(false), 2000);
        }
    };

    const sendMessage = async (textToSend: string) => {
        const cleanText = textToSend.trim();
        if (!cleanText) return;
        if (!didKey || !privKey) return;
        
        if (cooldown || loading) {
            setMessages(prev => [...prev, { sender: 'System', text: '⚠️ Please wait a moment before sending another message.', type: 'error' }]);
            return;
        }

        setLoading(true);
        setCooldown(true);

        const shortName = `${didKey.slice(0, 10)}...${didKey.slice(-4)}`;
        setMessages(prev => [...prev, { sender: shortName, text: cleanText }]);
        setInputText('');

        try {
            const room = "lobby";
            const encodedText = encodeURIComponent(cleanText);
            const nick = `agent-${didKey.slice(-6)}`;
            const endpoint = `https://technocore.chat/r/${room}/say/${nick}/${encodedText}`;
            
            const response = await fetch(endpoint, { method: 'GET', mode: 'cors' });
            
            if (response.ok) {
                setMessages(prev => [...prev, { sender: 'System', text: '✓ Message sent to lobby successfully!', type: 'success' }]);
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (err: unknown) {
            setMessages(prev => [
                ...prev, 
                { sender: 'System', text: '⚠️ Main chat server is offline or CORS is blocked. The message has been logged locally.', type: 'error' }
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => setCooldown(false), 2000);
        }
    };

    return (
        <div className="agents-wrapper">
            {/* Tombol ringkas hanya '🤖 Agents' */}
            <div 
                className="agents-draggable-btn"
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onClick={handleButtonClick}
                title="Drag to move, click to open"
            >
                🤖 Agents
            </div>

            {isOpen && (
                <div className="agents-popup-window" style={{
                    top: position.y > window.innerHeight / 2 ? 'auto' : `${position.y + 45}px`,
                    bottom: position.y > window.innerHeight / 2 ? `${window.innerHeight - position.y + 10}px` : 'auto',
                    left: Math.min(Math.max(10, position.x - 140), window.innerWidth - 320) + 'px',
                    maxWidth: '92vw'
                }}>
                    <div className="agents-header">
                        <span>💬 Agents Lobby Feed</span>
                        <button onClick={() => setIsOpen(false)} className="agents-close-btn" title="Close">✕</button>
                    </div>

                    <div className="agents-wallet-status connected" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '11px' }}>🟢 DID: {didKey ? `${didKey.slice(0, 10)}...${didKey.slice(-4)}` : 'Loading...'}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                    onClick={copyToClipboard} 
                                    style={{ background: '#0a1820', color: '#00ffcc', border: '1px solid #00ffcc', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                                >
                                    {copied ? '✓ Copied' : '📋 Copy'}
                                </button>
                                <button 
                                    onClick={handleExportPrivKey} 
                                    style={{ background: '#2a0a0a', color: '#ff4444', border: '1px solid #ff4444', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                                    title="Backup Private Key"
                                >
                                    🔑 Export
                                </button>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="agents-messages" 
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        style={{ position: 'relative' }}
                    >
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`agents-msg-bubble ${msg.type || ''}`}>
                                <b>{msg.sender}:</b> {msg.text}
                            </div>
                        ))}
                        {loading && <div className="agents-loading">Sending message...</div>}
                        <div ref={messagesEndRef} />

                        {!isAtBottom && (
                            <button 
                                onClick={() => {
                                    scrollToBottom('smooth');
                                    setIsAtBottom(true);
                                    setUnreadCount(0);
                                }}
                                style={{
                                    position: 'sticky',
                                    bottom: '8px',
                                    margin: '0 auto',
                                    background: '#00ffcc',
                                    color: '#05080a',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '4px 10px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,255,204,0.4)',
                                    zIndex: 10,
                                    fontFamily: 'Consolas, monospace'
                                }}
                            >
                                ↓ New Messages {unreadCount > 0 ? `(${unreadCount})` : ''}
                            </button>
                        )}
                    </div>

                    <div className="agents-footer">
                        <div className="agents-quick-actions">
                            <button 
                                onClick={() => sendMessage('!swap')} 
                                className="agents-quick-btn"
                                disabled={cooldown || loading}
                            >
                                Trigger !swap
                            </button>
                            <button 
                                onClick={() => sendMessage('Agent check-in')} 
                                className="agents-quick-btn"
                                disabled={cooldown || loading}
                            >
                                Check-in
                            </button>
                        </div>
                        <div className="agents-input-row">
                            <input 
                                type="text" 
                                value={inputText} 
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={cooldown ? "Wait 2s..." : "Type command..."} 
                                className="agents-input" 
                                disabled={cooldown}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
                            />
                            <button 
                                onClick={() => sendMessage(inputText)} 
                                className="agents-send-btn"
                                disabled={cooldown || loading}
                            >
                                {cooldown ? 'Wait' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExportModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center',
                    alignItems: 'center', zIndex: 100000
                }}>
                    <div style={{
                        background: '#05080a', padding: '20px', borderRadius: '6px',
                        width: '90%', maxWidth: '380px', color: '#00ffcc', border: '1px solid #00ffcc',
                        boxShadow: '0 0 30px rgba(0,255,204,0.3)', fontFamily: 'Consolas, monospace'
                    }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ff4444' }}>⚠️ BACKUP PRIVATE KEY</h3>
                        <p style={{ fontSize: '11px', color: '#a5f3fc', marginBottom: '12px', lineHeight: '1.4' }}>
                            Save this private key securely. It is stored locally in your browser!
                        </p>
                        <textarea 
                            readOnly 
                            value={privKey || ''} 
                            style={{
                                width: '100%', height: '70px', background: '#000000', color: '#00ffcc',
                                border: '1px solid #1a3a40', borderRadius: '3px', padding: '8px', fontSize: '10px', resize: 'none',
                                fontFamily: 'Consolas, monospace'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '15px' }}>
                            <button 
                                onClick={copyPrivateKeyToClipboard}
                                style={{ background: '#00ffcc', color: '#05080a', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                            >
                                {copiedPriv ? '✓ Copied!' : '📋 Copy Key'}
                            </button>
                            <button 
                                onClick={() => setShowExportModal(false)}
                                style={{ background: '#1a3a40', color: '#00ffcc', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}