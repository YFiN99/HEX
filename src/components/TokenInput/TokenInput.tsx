import "./TokenInput.css";
import { useMemo } from "react";
import { CHAINS } from "../../config/chain";
import { useWallet } from "../../context/WalletContext";

type Props = {
    title: string;
    token: string;
    amount: string;
    balance: string;

    onAmountChange?: (value: string) => void;
    onTokenClick?: () => void;
    onMax?: () => void;
};

export default function TokenInput({
    title,
    token,
    amount,
    balance,

    onAmountChange,
    onTokenClick,
    onMax

}: Props) {

    const { chainId } = useWallet();

    const chain = useMemo(() => {
        return CHAINS.find(c => c.chainId === chainId) || CHAINS[0];
    }, [chainId]);

    // Cari logo token berdasarkan jaringan yang aktif (chain.tokens) bukan dari config global statis
    const currentToken = useMemo(() => {
        return chain?.tokens?.find(t => t.symbol === token);
    }, [chain, token]);

    return (
        <div className="tokenInput">
            <div className="tokenHeader">
                <span>
                    {title}
                </span>
                <small>
                    Balance {balance}
                </small>
            </div>

            <input
                type="number"
                inputMode="decimal"
                className="tokenAmount"
                placeholder="0.0"
                value={amount}
                onChange={(e)=>
                    onAmountChange?.(
                        e.target.value
                    )
                }
            />

            <div className="tokenBottom">
                <button
                    className="selectToken"
                    onClick={onTokenClick}
                >
                    {currentToken?.logo && (
                        <img
                            className="tokenLogo"
                            src={currentToken.logo}
                            alt={token}
                        />
                    )}
                    {token}
                    ▼
                </button>

                <button
                    className="maxButton"
                    onClick={onMax}
                >
                    MAX
                </button>
            </div>
        </div>
    );
}