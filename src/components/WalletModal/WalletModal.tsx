// src/components/WalletModal/WalletModal.tsx

import "./WalletModal.css";

import {
    Search,
    X,
    Loader2,
    Plus
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState
} from "react";

import { ethers } from "ethers";

import { CHAINS } from "../../config/chain";

import { useWallet } from "../../context/WalletContext";

type Props = {
    onClose: () => void;
    onConnect: () => void | Promise<void>;
};

type WalletItemProps = {
    title: string;
    subtitle?: string;
    letter: string;
    className?: string;
    installed?: boolean;
    onClick: () => void;
};

function WalletIcon({
    letter,
    className = ""
}: {
    letter: string;
    className?: string;
}) {
    return (
        <div
            className={
                "walletLogo " +
                className
            }
        >
            {letter}
        </div>
    );
}

function WalletItem({
    title,
    subtitle,
    letter,
    className,
    installed,
    onClick
}: WalletItemProps) {

    return (
        <button
            type="button"
            className="walletModalItem"
            onClick={onClick}
        >

            <WalletIcon
                letter={letter}
                className={className}
            />

            <div className="walletModalItemText">

                <strong>
                    {title}
                </strong>

                {subtitle && (
                    <small>
                        {subtitle}
                    </small>
                )}

            </div>

            {installed && (
                <span className="walletInstalled">
                    INSTALLED
                </span>
            )}

        </button>
    );
}

export default function WalletModal({
    onClose,
    onConnect
}: Props) {

    return (
        <div
            className="walletModalOverlay"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }

            }}
        >

            <div className="walletModal">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="walletModalHeader">

                    <div>
                        <h2>
                            Connect your wallet
                        </h2>

                        <p>
                            Connect your wallet to use HEX.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="walletModalClose"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </div>

                {/* =================================================
                    OR
                ================================================= */}

                <div className="walletDivider">

                    <span />

                    <label>
                        OR USE A WALLET
                    </label>

                    <span />

                </div>

                {/* =================================================
                    SUGGESTED
                ================================================= */}

                <div className="walletSection">

                    <div className="walletSectionTitle">
                        SUGGESTED WALLETS
                    </div>

                    <WalletItem
                        title="Rabby Wallet"
                        subtitle="Browser wallet"
                        letter="R"
                        className="rabby"
                        installed={true}
                        onClick={onConnect}
                    />

                    <WalletItem
                        title="OKX Wallet"
                        subtitle="Browser wallet"
                        letter="OKX"
                        className="okx"
                        onClick={onConnect}
                    />

                </div>

                {/* =================================================
                    OTHER WALLETS
                ================================================= */}

                <div className="walletSection">

                    <div className="walletSectionTitle">
                        OTHER WALLETS
                    </div>

                    <div className="walletGrid">

                        <WalletItem
                            title="OKX"
                            letter="OKX"
                            className="okx"
                            onClick={onConnect}
                        />

                        <WalletItem
                            title="RABBY"
                            letter="R"
                            className="rabby"
                            onClick={onConnect}
                        />

                        <WalletItem
                            title="BITGET"
                            letter="B"
                            className="bitget"
                            onClick={onConnect}
                        />

                    </div>

                </div>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="walletModalFooter">

                    <div className="walletFooterLine" />

                    <span>
                        Secured by HEX
                    </span>

                </div>

            </div>

        </div>
    );
}