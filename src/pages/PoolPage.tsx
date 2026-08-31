import { useNavigation } from "../context/NavigationContext";
import PoolCard from "../components/PoolCard/PoolCard";
import usePool from "../hooks/usePool";
import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";

export default function PoolPage() {
    const {
        pairs,
        refresh,
        loading
    } = usePool();

    const { navigate } = useNavigation();

    const { chainId } = useWallet();

    // Sama seperti SwapCard: tidak fallback ke CHAINS[0]. Kalau belum
    // ada chain aktif, tampilkan pesan "Pilih network dulu" alih-alih
    // memanggil refresh()/menampilkan data pool dari chain manapun.
    const noChainSelected = !CHAINS.some(c => c.chainId === chainId);

    return (
        <div className="pool-wrapper">

            <div className="pool-card">

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="pool-header">

                    <h2>
                        Your Liquidity
                    </h2>

                    <button
                        className="refreshButton"
                        onClick={refresh}
                        disabled={loading || noChainSelected}
                    >
                        {loading
                            ? "Loading..."
                            : "Refresh"}
                    </button>

                </div>


                {/* =====================================================
                    NO CHAIN SELECTED
                ===================================================== */}

                {noChainSelected && (

                    <div className="emptyPool">

                        <h3>
                            Select a network first
                        </h3>

                        <p>
                            Choose a network above to view your liquidity positions.
                        </p>

                    </div>

                )}


                {/* =====================================================
                    INITIAL LOADING
                ===================================================== */}

                {!noChainSelected && loading && pairs.length === 0 && (

                    <div className="emptyPool">

                        <h3>
                            Loading pools...
                        </h3>

                        <p>
                            Reading your liquidity positions.
                        </p>

                    </div>

                )}


                {/* =====================================================
                    NO LIQUIDITY
                ===================================================== */}

                {!noChainSelected && !loading && pairs.length === 0 && (

                    <div className="emptyPool">

                        <h3>
                            No liquidity positions.
                        </h3>

                        <p>
                            Add liquidity to receive LP tokens.
                        </p>

                        <button
                            onClick={() =>
                                navigate("addLiquidity")
                            }
                            style={{
                                marginTop: "10px",
                                padding: "14px 26px",
                                border: "none",
                                borderRadius: "14px",
                                background: "#14C8FF",
                                color: "#000",
                                fontWeight: 700,
                                fontSize: "16px",
                                cursor: "pointer"
                            }}
                        >
                            + Add Liquidity
                        </button>

                    </div>

                )}


                {/* =====================================================
                    POOLS
                ===================================================== */}

                {!noChainSelected && pairs.length > 0 && (

                    <div>

                        {pairs.map(
                            (pool, index) => (

                                <PoolCard
                                    key={
                                        `${
                                            pool.pair ||
                                            pool.address ||
                                            "pool"
                                        }-${index}`
                                    }
                                    pool={pool}
                                />

                            )
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}