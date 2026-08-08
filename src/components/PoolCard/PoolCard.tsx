import "./PoolCard.css";
import { useNavigation } from "../../hooks/useNavigation";
import { ethers } from "ethers";

type Props = {
    pool: any;
};

export default function PoolCard({ pool }: Props) {
    const { navigate } = useNavigation();

    // Fungsi helper untuk memformat angka besar dari Wei/BigInt agar rapi dibaca
    function formatNumber(value: any, decimals: number = 18, maxDecimals: number = 4) {
        if (!value) return "0";
        try {
            // Jika nilainya berupa BigInt atau string angka besar, format menggunakan ethers
            const formatted = typeof value === "bigint" || typeof value === "string" 
                ? ethers.formatUnits(value, decimals) 
                : value.toString();
            
            const num = Number(formatted);
            if (num === 0) return "0";
            if (num < 0.0001) return "< 0.0001";
            
            return num.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: maxDecimals
            });
        } catch {
            return value.toString();
        }
    }

    const share =
        pool.totalSupply === 0n
            ? 0
            : Number(
                (pool.lp * 1000000n) /
                    pool.totalSupply
              ) / 10000;

    return (
        <div className="poolItem">
            <div className="poolTop">
                <h3>
                    {pool.token0} / {pool.token1}
                </h3>
            </div>

            <div className="poolBody">
                <div>
                    <span>LP Balance</span>
                    <b>{formatNumber(pool.lp)}</b>
                </div>

                <div>
                    <span>Reserve 0</span>
                    <b>{formatNumber(pool.reserve0)}</b>
                </div>

                <div>
                    <span>Reserve 1</span>
                    <b>{formatNumber(pool.reserve1)}</b>
                </div>

                <div>
                    <span>Pool Share</span>
                    <b>{share.toFixed(4)}%</b>
                </div>
            </div>

            <div className="poolButtons">
                <button
                    onClick={() =>
                        navigate(
                            "addLiquidity",
                            {
                                ...pool,
                                lp: pool.lp?.toString() || "0",
                                reserve0: pool.reserve0?.toString() || "0",
                                reserve1: pool.reserve1?.toString() || "0",
                                totalSupply: pool.totalSupply?.toString() || "0",
                            }
                        )
                    }
                >
                    Add
                </button>

                <button
                    onClick={() =>
                        navigate(
                            "removeLiquidity",
                            {
                                ...pool,
                                lp: pool.lp?.toString() || "0",
                                reserve0: pool.reserve0?.toString() || "0",
                                reserve1: pool.reserve1?.toString() || "0",
                                totalSupply: pool.totalSupply?.toString() || "0",
                            }
                        )
                    }
                >
                    Remove
                </button>
            </div>
        </div>
    );
}