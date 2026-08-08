import { useNavigation } from "../context/NavigationContext";
import PoolCard from "../components/PoolCard/PoolCard";
import usePool from "../hooks/usePool";

export default function PoolPage() {
    const {
        pairs,
        refresh,
        loading
    } = usePool();

    const { navigate } = useNavigation();

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
                        disabled={loading}
                    >
                        {loading
                            ? "Loading..."
                            : "Refresh"}
                    </button>

                </div>


                {/* =====================================================
                    INITIAL LOADING
                ===================================================== */}

                {loading && pairs.length === 0 && (

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

                {!loading && pairs.length === 0 && (

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

                {pairs.length > 0 && (

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