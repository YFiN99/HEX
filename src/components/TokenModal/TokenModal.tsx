// src/components/TokenModal/TokenModal.tsx



import "./TokenModal.css";



import { Search, X } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { ethers } from "ethers";



import { CHAINS } from "../../config/chain";

import { useWallet } from "../../context/WalletContext";



type Props = {

    open: boolean;

    onClose: () => void;

    onSelect: (symbol: string) => void;

};



type TokenItem = {

    symbol: string;

    name: string;

    address: string;

    decimals: number;

    logo?: string;

    balance: string;

};



// ============================================================

// MULTICALL3 ABI

// ============================================================



const MULTICALL3_ABI = [

    "function aggregate3(tuple(address target,bool allowFailure,bytes callData)[] calls) view returns (tuple(bool success,bytes returnData)[] returnData)"

];



// ============================================================

// ERC20 ABI

// ============================================================



const ERC20_BALANCE_ABI = [

    "function balanceOf(address owner) view returns (uint256)"

];



export default function TokenModal({

    open,

    onClose,

    onSelect

}: Props) {



    const {

        provider,

        address,

        chainId

    } = useWallet();



    const chain = useMemo(() => {



        return CHAINS.find(

            c => c.chainId === chainId

        );



    }, [chainId]);



    const [search, setSearch] =

        useState("");



    const [tokens, setTokens] =

        useState<TokenItem[]>([]);



    // ========================================================

    // LOAD ALL BALANCES

    // ========================================================



    useEffect(() => {



        if (!open) return;

        if (!provider) return;

        if (!address) return;

        if (!chain) return;



        let cancelled = false;



        async function loadBalances() {



            try {



                // ------------------------------------------------

                // Multicall3 harus tersedia di chain config

                // ------------------------------------------------



                const multicallAddress =

                    (chain as any).multicall3;



                if (

                    !multicallAddress ||

                    !ethers.isAddress(multicallAddress)

                ) {



                    console.error(

                        "Multicall3 address belum tersedia untuk:",

                        chain.chainName

                    );



                    return;



                }



                // ------------------------------------------------

                // Multicall contract

                // ------------------------------------------------



                const multicall =

                    new ethers.Contract(

                        multicallAddress,

                        MULTICALL3_ABI,

                        provider

                    );



                // ------------------------------------------------

                // Interface ERC20

                // ------------------------------------------------



                const erc20Interface =

                    new ethers.Interface(

                        ERC20_BALANCE_ABI

                    );



                // ------------------------------------------------

                // Native balance

                // ------------------------------------------------



                // ------------------------------------------------
                // Token yang bisa dipilih user.
                //
                // Token wrapped-native (mis. WQTER, WX1) DISEMBUNYIKAN
                // di sini karena situs ini tidak punya fitur wrap/unwrap
                // manual -- user tidak akan pernah benar-benar memegang
                // token itu di walletnya. Token ini cuma dipakai secara
                // internal (router otomatis wrap/unwrap lewat
                // addLiquidityETH / removeLiquidityETH / swap native).
                // ------------------------------------------------

                const selectableTokens =

                    chain.tokens.filter(

                        token =>

                            !(token as any).isWrappedNative

                    );

                const nativeTokens =

                    selectableTokens.filter(

                        token =>

                            token.address === "native"

                    );



                const erc20Tokens =

                    selectableTokens.filter(

                        token =>

                            token.address !== "native"

                    );



                // =================================================

                // 1. NATIVE BALANCE

                // =================================================



                let nativeBalance = 0n;



                if (nativeTokens.length > 0) {



                    try {



                        nativeBalance =

                            await provider.getBalance(

                                address

                            );



                    } catch (error) {



                        console.error(

                            "Native balance error:",

                            error

                        );



                    }



                }



                // =================================================

                // 2. BUILD MULTICALL

                // =================================================



                const calls =

                    erc20Tokens.map(

                        token => ({



                            target:

                                token.address,



                            allowFailure:

                                true,



                            callData:

                                erc20Interface.encodeFunctionData(

                                    "balanceOf",

                                    [address]

                                )



                        })

                    );



                // =================================================

                // 3. ONE RPC CALL FOR ALL ERC20 BALANCES (Static Call)

                // =================================================



                let multicallResults:

                    {

                        success: boolean;

                        returnData: string;

                    }[] = [];



                if (calls.length > 0) {



                    multicallResults =

                        await multicall.aggregate3.staticCall(

                            calls

                        );



                }



                // =================================================

                // 4. BUILD TOKEN LIST

                // =================================================



                const list: TokenItem[] = [];



                // -------------------------------------------------

                // Native tokens

                // -------------------------------------------------



                for (

                    const token of nativeTokens

                ) {



                    list.push({



                        symbol:

                            token.symbol,



                        name:

                            token.name,



                        address:

                            token.address,



                        decimals:

                            token.decimals,



                        logo:

                            (token as any).logo,



                        balance:

                            Number(

                                ethers.formatUnits(

                                    nativeBalance,

                                    token.decimals

                                )

                            ).toLocaleString(

                                undefined,

                                {

                                    maximumFractionDigits: 6

                                }

                            )



                    });



                }



                // -------------------------------------------------

                // ERC20 tokens

                // -------------------------------------------------



                for (

                    let i = 0;

                    i < erc20Tokens.length;

                    i++

                ) {



                    const token =

                        erc20Tokens[i];



                    const result =

                        multicallResults[i];



                    let balance =

                        0n;



                    // ---------------------------------------------

                    // Multicall sukses

                    // ---------------------------------------------



                    if (

                        result &&

                        result.success

                    ) {



                        try {



                            const decoded =

                                erc20Interface.decodeFunctionResult(

                                    "balanceOf",

                                    result.returnData

                                );



                            balance =

                                BigInt(

                                    decoded[0].toString()

                                );



                        } catch (error) {



                            console.error(

                                "Decode balance error:",

                                token.symbol,

                                error

                            );



                        }



                    }



                    list.push({



                        symbol:

                            token.symbol,



                        name:

                            token.name,



                        address:

                            token.address,



                        decimals:

                            token.decimals,



                        logo:

                            (token as any).logo,



                        balance:

                            Number(

                                ethers.formatUnits(

                                    balance,

                                    token.decimals

                                )

                            ).toLocaleString(

                                undefined,

                                {

                                    maximumFractionDigits: 6

                                }

                            )



                    });



                }



                // =================================================

                // SORT BALANCE TERBESAR

                // =================================================



                list.sort(

                    (a, b) =>



                        Number(

                            b.balance.replace(

                                /,/g,

                                ""

                            )

                        )



                        -



                        Number(

                            a.balance.replace(

                                /,/g,

                                ""

                            )

                        )

                );



                // Jangan update state kalau component

                // sudah unmount / chain berubah

                if (!cancelled) {



                    setTokens(list);



                }



            } catch (error) {



                console.error(

                    "TokenModal balance error:",

                    error

                );



                if (!cancelled) {



                    // Tetap tampilkan token,

                    // tetapi balance 0 jika RPC gagal.



                    const fallback =

                        chain.tokens

                        .filter(

                            token =>

                                !(token as any).isWrappedNative

                        )

                        .map(

                            token => ({



                                symbol:

                                    token.symbol,



                                name:

                                    token.name,



                                address:

                                    token.address,



                                decimals:

                                    token.decimals,



                                logo:

                                    (token as any).logo,



                                balance:

                                    "0"



                            })

                        );



                    setTokens(fallback);



                }



            }



        }



        loadBalances();



        return () => {



            cancelled = true;



        };



    }, [

        open,

        provider,

        address,

        chain

    ]);



    // ============================================================

    // CLOSED

    // ============================================================



    if (!open) return null;



    // ============================================================

    // SEARCH

    // ============================================================



    const filtered =

        tokens.filter(



            token =>



                token.symbol

                    .toLowerCase()

                    .includes(

                        search.toLowerCase()

                    )



                ||



                token.name

                    .toLowerCase()

                    .includes(

                        search.toLowerCase()

                    )



        );



    // ============================================================

    // RENDER

    // ============================================================



    return (



        <div className="modalOverlay">



            <div className="modalCard">



                {/* =================================================

                    HEADER

                ================================================= */}



                <div className="modalHeader">



                    <h2>

                        Select Token

                    </h2>



                    <button

                        className="close"

                        onClick={onClose}

                    >

                        <X size={20} />

                    </button>



                </div>



                {/* =================================================

                    SEARCH

                ================================================= */}



                <div className="searchBox">



                    <Search size={18} />



                    <input

                        value={search}

                        onChange={(e) =>

                            setSearch(

                                e.target.value

                            )

                        }

                        placeholder="Search token..."

                    />



                </div>



                {/* =================================================

                    TOKEN LIST

                ================================================= */}



                <div className="tokenList">



                    {filtered.map(

                        token => (



                            <button

                                key={

                                    token.address

                                }

                                className="tokenItem"

                                onClick={() => {



                                    onSelect(

                                        token.symbol

                                    );



                                    onClose();



                                }}

                            >



                                <div

                                    style={{

                                        display:

                                            "flex",

                                        alignItems:

                                            "center",

                                        gap: 12

                                    }}

                                >



                                    {token.logo && (



                                        <img

                                            src={

                                                token.logo

                                            }

                                            alt={

                                                token.symbol

                                            }

                                            style={{

                                                width: 34,

                                                height: 34,

                                                borderRadius:

                                                    "50%"

                                            }}

                                        />



                                    )}



                                    <div>



                                        <div

                                            className="symbol"

                                        >

                                            {

                                                token.symbol

                                            }

                                        </div>



                                        <small>

                                            {

                                                token.name

                                            }

                                        </small>



                                    </div>



                                </div>



                                <b>

                                    {

                                        token.balance

                                    }

                                </b>



                            </button>



                        )

                    )}



                </div>



            </div>



        </div>



    );



}