import "./RemoveLiquidityCard.css";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

import SwapButton from "../SwapButton/SwapButton";
import Toast from "../Toast/Toast";

import {
    useNavigation
} from "../../context/NavigationContext";

import {
    useWallet
} from "../../context/WalletContext";

import {
    CHAINS
} from "../../config/chain";


// ============================================================
// PAIR ABI
// ============================================================

const PAIR_ABI = [

    "function token0() view returns (address)",

    "function token1() view returns (address)",

    "function getReserves() view returns (uint112 reserve0,uint112 reserve1,uint32 blockTimestampLast)",

    "function totalSupply() view returns (uint256)",

    "function balanceOf(address owner) view returns (uint256)"

];


// ============================================================
// ERC20 ABI
// ============================================================

const ERC20_ABI = [

    "function symbol() view returns (string)",

    "function name() view returns (string)",

    "function decimals() view returns (uint8)"

];


// ============================================================
// ERC20 APPROVE ABI
// ============================================================

const ERC20_APPROVE_ABI = [

    "function allowance(address owner,address spender) view returns (uint256)",

    "function approve(address spender,uint256 amount) returns (bool)"

];


// ============================================================
// STANDARD UNISWAP-V2 ROUTER ABI
// ============================================================

const ROUTER_ABI = [

    // --------------------------------------------------------
    // TOKEN / TOKEN
    // --------------------------------------------------------

    "function removeLiquidity(address tokenA,address tokenB,uint256 liquidity,uint256 amountAMin,uint256 amountBMin,address to,uint256 deadline) returns (uint256 amountA,uint256 amountB)",


    // --------------------------------------------------------
    // WNATIVE / TOKEN
    // --------------------------------------------------------

    "function removeLiquidityETH(address token,uint256 liquidity,uint256 amountTokenMin,uint256 amountETHMin,address to,uint256 deadline) returns (uint256 amountToken,uint256 amountETH)"

];


// ============================================================
// ZERO ADDRESS
// ============================================================

const ZERO =
    ethers.ZeroAddress;


// ============================================================
// TYPES
// ============================================================

type TokenInfo = {

    address: string;

    symbol: string;

    name: string;

    decimals: number;

    isNative: boolean;

};


// ============================================================
// FORMAT
// ============================================================

function formatAmount(
    value: bigint,
    decimals: number,
    maxDecimals = 6
): string {

    try {

        if (value === 0n) {
            return "0";
        }

        const formatted =
            ethers.formatUnits(
                value,
                decimals
            );

        const number =
            Number(formatted);

        if (!Number.isFinite(number)) {
            return formatted;
        }

        return number.toLocaleString(
            "en-US",
            {
                maximumFractionDigits:
                    maxDecimals
            }
        );

    } catch {

        return "0";

    }

}


// ============================================================
// SHORT ADDRESS
// ============================================================

function shortAddress(
    address: string
): string {

    if (!address) {
        return "—";
    }

    return (
        address.slice(0, 6) +
        "..." +
        address.slice(-4)
    );

}


// ============================================================
// COMPONENT
// ============================================================

export default function RemoveLiquidityCard() {


    // ========================================================
    // NAVIGATION
    // ========================================================

    const {
        navigate,

        data
    } = useNavigation();


    // ========================================================
    // WALLET
    // ========================================================

    const {

        provider,

        signer,

        address,

        chainId

    } = useWallet();


    // ========================================================
    // CURRENT CHAIN
    // ========================================================

    const chain = useMemo(() => {

        return (
            CHAINS.find(
                item =>
                    item.chainId ===
                    chainId
            ) ||
            CHAINS[0]
        );

    }, [chainId]);


    // ========================================================
    // PAIR ADDRESS
    //
    // Ambil dari NavigationContext.data
    //
    // PoolCard sekarang mengirim:
    //
    // pair
    //
    // pairAddress juga didukung sebagai fallback.
    // ========================================================

    const pairAddress =
        useMemo(() => {

            const value =

                data?.pair ??

                data?.pairAddress ??

                data?.address ??

                "";

            if (
                typeof value !==
                "string"
            ) {

                return "";

            }

            if (
                !ethers.isAddress(
                    value
                )
            ) {

                return "";

            }

            if (
                value ===
                ZERO
            ) {

                return "";

            }

            return ethers.getAddress(
                value
            );

        }, [data]);


    // ========================================================
    // STATE
    // ========================================================

    const [

        loading,

        setLoading

    ] = useState(false);


    const [

        reading,

        setReading

    ] = useState(false);


    const [

        percent,

        setPercent

    ] = useState(0);


    const [

        token0,

        setToken0

    ] = useState<TokenInfo | null>(
        null
    );


    const [

        token1,

        setToken1

    ] = useState<TokenInfo | null>(
        null
    );


    const [

        reserve0,

        setReserve0

    ] = useState<bigint>(
        0n
    );


    const [

        reserve1,

        setReserve1

    ] = useState<bigint>(
        0n
    );


    const [

        totalSupply,

        setTotalSupply

    ] = useState<bigint>(
        0n
    );


    const [

        lpBalance,

        setLpBalance

    ] = useState<bigint>(
        0n
    );


    const [

        error,

        setError

    ] = useState("");


    // ========================================================
    // TOAST
    // ========================================================

    const [

        toastOpen,

        setToastOpen

    ] = useState(false);


    const [

        txHash,

        setTxHash

    ] = useState("");


    // ========================================================
    // IS NATIVE / WRAPPED NATIVE
    // ========================================================

    function isWrappedNative(
        tokenAddress: string
    ): boolean {

        if (!chain) {
            return false;
        }

        if (
            !tokenAddress ||
            !ethers.isAddress(
                tokenAddress
            )
        ) {

            return false;

        }

        return (

            tokenAddress.toLowerCase() ===
            chain.wrappedNative.toLowerCase()

        );

    }


    // ========================================================
    // TOKEN METADATA
    // ========================================================

    async function readTokenInfo(
        tokenAddress: string
    ): Promise<TokenInfo> {


        // ----------------------------------------------------
        // WRAPPED NATIVE
        // ----------------------------------------------------

        if (
            isWrappedNative(
                tokenAddress
            )
        ) {

            return {

                address:
                    ethers.getAddress(
                        tokenAddress
                    ),

                symbol:
                    chain.nativeSymbol,

                name:
                    chain.nativeSymbol,

                decimals:
                    18,

                isNative:
                    true

            };

        }


        // ----------------------------------------------------
        // CONFIG TOKEN
        // ----------------------------------------------------

        const configured =
            chain.tokens.find(
                token =>
                    token.address !==
                    "native" &&

                    token.address.toLowerCase() ===
                    tokenAddress.toLowerCase()
            );


        // ----------------------------------------------------
        // TRY CONFIG FIRST
        // ----------------------------------------------------

        if (configured) {

            return {

                address:
                    ethers.getAddress(
                        tokenAddress
                    ),

                symbol:
                    configured.symbol,

                name:
                    configured.name,

                decimals:
                    configured.decimals,

                isNative:
                    false

            };

        }


        // ----------------------------------------------------
        // READ FROM CONTRACT
        // ----------------------------------------------------

        if (!provider) {

            throw new Error(
                "Wallet provider unavailable."
            );

        }


        const contract =
            new ethers.Contract(
                tokenAddress,
                ERC20_ABI,
                provider
            );


        const [

            symbol,

            name,

            decimals

        ] = await Promise.all([

            contract.symbol(),

            contract.name(),

            contract.decimals()

        ]);


        return {

            address:
                ethers.getAddress(
                    tokenAddress
                ),

            symbol:
                String(symbol),

            name:
                String(name),

            decimals:
                Number(decimals),

            isNative:
                false

        };

    }


    // ========================================================
    // READ PAIR
    //
    // IMPORTANT:
    //
    // token0/token1 dibaca LANGSUNG dari pair.
    //
    // Jadi tidak peduli pair-nya:
    //
    // QTER / HEX
    // QTER / BTC
    // HEX / BTC
    // USDT / BTC
    // token / token
    //
    // ========================================================

    async function loadPair() {

        if (!provider) {

            return;

        }

        if (!address) {

            return;

        }

        if (!pairAddress) {

            setError(
                "Liquidity pool data is unavailable."
            );

            return;

        }


        try {

            setReading(true);

            setError("");


            // ------------------------------------------------
            // PAIR CONTRACT
            // ------------------------------------------------

            const pair =
                new ethers.Contract(
                    pairAddress,
                    PAIR_ABI,
                    provider
                );


            // ------------------------------------------------
            // READ EVERYTHING
            // ------------------------------------------------

            const [

                pairToken0,

                pairToken1,

                reserves,

                supply,

                walletLP

            ] = await Promise.all([

                pair.token0(),

                pair.token1(),

                pair.getReserves(),

                pair.totalSupply(),

                pair.balanceOf(
                    address
                )

            ]);


            // ------------------------------------------------
            // TOKEN METADATA
            // ------------------------------------------------

            const [

                info0,

                info1

            ] = await Promise.all([

                readTokenInfo(
                    pairToken0
                ),

                readTokenInfo(
                    pairToken1
                )

            ]);


            // ------------------------------------------------
            // UPDATE STATE
            // ------------------------------------------------

            setToken0(
                info0
            );

            setToken1(
                info1
            );


            setReserve0(
                BigInt(
                    reserves[0].toString()
                )
            );


            setReserve1(
                BigInt(
                    reserves[1].toString()
                )
            );


            setTotalSupply(
                BigInt(
                    supply.toString()
                )
            );


            // ------------------------------------------------
            // IMPORTANT:
            //
            // LP BALANCE SELALU DIBACA LANGSUNG DARI PAIR.
            //
            // Tidak menggunakan data.lp sebagai sumber utama.
            // ------------------------------------------------

            setLpBalance(
                BigInt(
                    walletLP.toString()
                )
            );


        } catch (err) {

            console.error(
                "RemoveLiquidity loadPair error:",
                err
            );


            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to read liquidity pool."
            );


            setToken0(null);

            setToken1(null);

            setReserve0(0n);

            setReserve1(0n);

            setTotalSupply(0n);

            setLpBalance(0n);


        } finally {

            setReading(false);

        }

    }


    // ========================================================
    // LOAD PAIR WHEN OPENED
    // ========================================================

    useEffect(() => {

        void loadPair();

    }, [

        provider,

        address,

        pairAddress,

        chainId

    ]);


    // ========================================================
    // RESET WHEN PAIR CHANGES
    // ========================================================

    useEffect(() => {

        setPercent(0);

        setError("");

        setTxHash("");

        setToastOpen(false);

    }, [

        pairAddress

    ]);


    // ========================================================
    // LP TO BURN
    // ========================================================

    const removingLP =
        useMemo(() => {

            if (
                lpBalance ===
                0n
            ) {

                return 0n;

            }

            if (
                percent <=
                0
            ) {

                return 0n;

            }

            if (
                percent >=
                100
            ) {

                return lpBalance;

            }

            return (

                lpBalance *
                BigInt(percent)

            ) / 100n;

        }, [

            lpBalance,

            percent

        ]);


    // ========================================================
    // TOKEN 0 AMOUNT
    // ========================================================

    const amount0 =
        useMemo(() => {

            if (
                totalSupply ===
                0n
            ) {

                return 0n;

            }

            if (
                removingLP ===
                0n
            ) {

                return 0n;

            }

            return (

                reserve0 *
                removingLP

            ) / totalSupply;

        }, [

            reserve0,

            removingLP,

            totalSupply

        ]);


    // ========================================================
    // TOKEN 1 AMOUNT
    // ========================================================

    const amount1 =
        useMemo(() => {

            if (
                totalSupply ===
                0n
            ) {

                return 0n;

            }

            if (
                removingLP ===
                0n
            ) {

                return 0n;

            }

            return (

                reserve1 *
                removingLP

            ) / totalSupply;

        }, [

            reserve1,

            removingLP,

            totalSupply

        ]);


    // ========================================================
    // DISPLAY AMOUNTS
    // ========================================================

    const displayAmount0 =

        token0

            ? formatAmount(
                amount0,
                token0.decimals
            )

            : "0";


    const displayAmount1 =

        token1

            ? formatAmount(
                amount1,
                token1.decimals
            )

            : "0";


    // ========================================================
    // PAIR TYPE
    // ========================================================

    const isNativePair =

        Boolean(

            token0?.isNative ||

            token1?.isNative

        );


    // ========================================================
    // HANDLE REMOVE
    // ========================================================

    async function handleRemove() {

        if (!signer) {

            setError(
                "Connect your wallet first."
            );

            return;

        }


        if (!address) {

            setError(
                "Wallet address unavailable."
            );

            return;

        }


        if (!pairAddress) {

            setError(
                "Liquidity pool address unavailable."
            );

            return;

        }


        if (!token0 || !token1) {

            setError(
                "Pair tokens are still loading."
            );

            return;

        }


        if (
            removingLP ===
            0n
        ) {

            setError(
                "Select liquidity to remove."
            );

            return;

        }


        if (
            totalSupply ===
            0n
        ) {

            setError(
                "Pool has no LP supply."
            );

            return;

        }


        try {

            setLoading(true);

            setError("");

            setToastOpen(false);

            setTxHash("");


            // =================================================
            // ROUTER
            // =================================================

            const router =
                new ethers.Contract(
                    chain.router,
                    ROUTER_ABI,
                    signer
                );


            // =================================================
            // LP TOKEN = PAIR ITSELF
            //
            // Router needs allowance to spend LP tokens.
            // =================================================

            const lpToken =
                new ethers.Contract(
                    pairAddress,
                    ERC20_APPROVE_ABI,
                    signer
                );


            // =================================================
            // CHECK ALLOWANCE
            // =================================================

            const allowance =
                await lpToken.allowance(
                    address,
                    chain.router
                );


            // =================================================
            // APPROVE ROUTER
            // =================================================

            if (
                allowance <
                removingLP
            ) {

                const approveTx =
                    await lpToken.approve(
                        chain.router,
                        ethers.MaxUint256
                    );

                await approveTx.wait();

            }


            // =================================================
            // MINIMUM AMOUNTS
            //
            // 0 = universal compatibility.
            //
            // The displayed amounts are informational and the
            // router performs the actual transfer.
            // =================================================

            const amount0Min =
                0n;

            const amount1Min =
                0n;


            // =================================================
            // DEADLINE
            // =================================================

            const deadline =
                Math.floor(
                    Date.now() /
                    1000
                ) + 60 * 20;


            // =================================================
            // EXECUTE
            // =================================================

            let tx;


            // =================================================
            // NATIVE / WNATIVE PAIR
            //
            // Example:
            //
            // WQTER / HEX
            //
            // Router unwraps WQTER and sends QTER.
            // =================================================

            if (
                isNativePair
            ) {


                let tokenAddress: string;

                let tokenAmountMin: bigint;

                let nativeAmountMin: bigint;


                if (
                    token0.isNative
                ) {

                    tokenAddress =
                        token1.address;

                    tokenAmountMin =
                        amount1Min;

                    nativeAmountMin =
                        amount0Min;

                } else {

                    tokenAddress =
                        token0.address;

                    tokenAmountMin =
                        amount0Min;

                    nativeAmountMin =
                        amount1Min;

                }


                tx =
                    await router.removeLiquidityETH(

                        tokenAddress,

                        removingLP,

                        tokenAmountMin,

                        nativeAmountMin,

                        address,

                        deadline

                    );

            }

            // =================================================
            // TOKEN / TOKEN
            // =================================================

            else {

                tx =
                    await router.removeLiquidity(

                        token0.address,

                        token1.address,

                        removingLP,

                        amount0Min,

                        amount1Min,

                        address,

                        deadline

                    );

            }


            // =================================================
            // WAIT
            // =================================================

            const receipt =
                await tx.wait();


            // =================================================
            // HASH
            // =================================================

            const hash =
                receipt?.hash ??
                tx?.hash ??
                "";


            setTxHash(
                hash
            );


            // =================================================
            // RESET
            // =================================================

            setPercent(0);


            // =================================================
            // RELOAD PAIR
            // =================================================

            await loadPair();


            // =================================================
            // SUCCESS
            // =================================================

            setToastOpen(
                true
            );


        } catch (err) {

            console.error(
                "Remove liquidity error:",
                err
            );


            let message =
                "Remove liquidity failed.";


            if (
                err instanceof Error
            ) {

                message =
                    err.message;

            }


            setError(
                message
            );


        } finally {

            setLoading(false);

        }

    }


    // ========================================================
    // BACK
    // ========================================================

    function handleBack() {

        if (loading) {
            return;
        }

        navigate(
            "pool"
        );

    }


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="remove-wrapper">

            <div className="remove-card">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="remove-header">

                    <button

                        type="button"

                        className="backButton"

                        onClick={
                            handleBack
                        }

                        disabled={
                            loading
                        }

                    >

                        ← Back

                    </button>


                    <h2>

                        Remove Liquidity

                    </h2>

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {reading && (

                    <div
                        style={{
                            padding:
                                "14px 0",
                            opacity:
                                0.65,
                            fontSize:
                                13
                        }}
                    >

                        Reading liquidity pool...

                    </div>

                )}


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div
                        style={{
                            marginTop:
                                12,
                            padding:
                                "11px 13px",
                            borderRadius:
                                12,
                            background:
                                "rgba(255,80,80,0.08)",
                            border:
                                "1px solid rgba(255,80,80,0.18)",
                            color:
                                "#ff7b7b",
                            fontSize:
                                12,
                            lineHeight:
                                1.45,
                            wordBreak:
                                "break-word"
                        }}
                    >

                        {error}

                    </div>

                )}


                {/* =================================================
                    LP BALANCE
                ================================================= */}

                <div className="lpBalance">

                    <span>
                        LP Balance
                    </span>

                    <b>

                        {formatAmount(
                            lpBalance,
                            18,
                            8
                        )}

                        {" "}LP

                    </b>

                </div>


                {/* =================================================
                    PAIR
                ================================================= */}

                <div className="remove-pair-info">

                    <span>
                        Pair
                    </span>

                    <b>

                        {pairAddress
                            ? shortAddress(
                                pairAddress
                            )
                            : "Loading..."}

                    </b>

                </div>


                {/* =================================================
                    TOKEN PAIR
                ================================================= */}

                <div
                    style={{
                        display:
                            "grid",
                        gridTemplateColumns:
                            "1fr 1fr",
                        gap:
                            10,
                        marginTop:
                            12
                    }}
                >

                    <div
                        style={{
                            padding:
                                "11px 12px",
                            borderRadius:
                                12,
                            background:
                                "rgba(255,255,255,0.04)",
                            border:
                                "1px solid rgba(255,255,255,0.07)"
                        }}
                    >

                        <div
                            style={{
                                fontSize:
                                    11,
                                opacity:
                                    0.5
                            }}
                        >

                            Token 0

                        </div>

                        <strong>

                            {token0?.symbol ??
                                "..."}

                        </strong>

                    </div>


                    <div
                        style={{
                            padding:
                                "11px 12px",
                            borderRadius:
                                12,
                            background:
                                "rgba(255,255,255,0.04)",
                            border:
                                "1px solid rgba(255,255,255,0.07)"
                        }}
                    >

                        <div
                            style={{
                                fontSize:
                                    11,
                                opacity:
                                    0.5
                            }}
                        >

                            Token 1

                        </div>

                        <strong>

                            {token1?.symbol ??
                                "..."}

                        </strong>

                    </div>

                </div>


                {/* =================================================
                    PERCENT
                ================================================= */}

                <div
                    className="sliderArea"
                >

                    <div
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "center",
                            marginBottom:
                                10
                        }}
                    >

                        <span>
                            {percent}%
                        </span>

                    </div>


                    <input

                        type="range"

                        min="0"

                        max="100"

                        step="1"

                        value={
                            percent
                        }

                        disabled={
                            loading ||
                            reading ||
                            lpBalance ===
                                0n
                        }

                        onChange={
                            event =>
                                setPercent(
                                    Number(
                                        event.target.value
                                    )
                                )
                        }

                        style={{
                            width:
                                "100%"
                        }}

                    />


                    <div
                        className="percentButtons"
                    >

                        {[

                            25,

                            50,

                            75,

                            100

                        ].map(
                            value => (

                                <button

                                    key={
                                        value
                                    }

                                    type="button"

                                    disabled={
                                        loading ||
                                        reading
                                    }

                                    onClick={() =>
                                        setPercent(
                                            value
                                        )
                                    }

                                >

                                    {value ===
                                    100
                                        ? "MAX"
                                        : `${value}%`}

                                </button>

                            )
                        )}

                    </div>

                </div>


                {/* =================================================
                    RECEIVE
                ================================================= */}

                <div
                    className="receiveInfo"
                >

                    <div>

                        <span>

                            {token0?.symbol ??
                                "Token 0"}

                        </span>

                        <b>

                            {reading
                                ? "Loading..."
                                : displayAmount0}

                        </b>

                    </div>


                    <div>

                        <span>

                            {token1?.symbol ??
                                "Token 1"}

                        </span>

                        <b>

                            {reading
                                ? "Loading..."
                                : displayAmount1}

                        </b>

                    </div>

                </div>


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div
                    className="removeSummary"
                >

                    <div>

                        <span>
                            LP To Burn
                        </span>

                        <b>

                            {formatAmount(
                                removingLP,
                                18,
                                8
                            )}

                            {" "}LP

                        </b>

                    </div>


                    <div>

                        <span>
                            Share Removed
                        </span>

                        <b>
                            {percent}%
                        </b>

                    </div>

                </div>


                {/* =================================================
                    REMOVE BUTTON
                ================================================= */}

                <SwapButton

                    loading={
                        loading
                    }

                    loadingText={
                        "Removing..."
                    }

                    text={
                        "REMOVE LIQUIDITY"
                    }

                    disabled={

                        loading ||

                        reading ||

                        !signer ||

                        !pairAddress ||

                        !token0 ||

                        !token1 ||

                        removingLP ===
                            0n

                    }

                    onClick={
                        handleRemove
                    }

                />


            </div>


            {/* =====================================================
                TOAST
            ===================================================== */}

            <Toast

                open={
                    toastOpen
                }

                title={
                    "Success"
                }

                message={
                    "Liquidity removed successfully"
                }

                tx={
                    txHash
                }

                explorer={
                    chain?.explorer?.replace(
                        /\/+$/,
                        ""
                    )
                }

                onClose={() =>
                    setToastOpen(
                        false
                    )
                }

            />

        </div>

    );

}