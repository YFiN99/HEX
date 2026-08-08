import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";

import { getPair } from "../service/pair";

export default function useLPBalance(

    tokenA: string,

    tokenB: string

) {

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

    const [lpBalance, setLPBalance] = useState("0");

    const [loading, setLoading] = useState(false);

    async function refresh() {

        if (!provider) return;
        if (!chain) return;
        if (!address) return;

        const A = chain.tokens.find(

            t => t.symbol === tokenA

        );

        const B = chain.tokens.find(

            t => t.symbol === tokenB

        );

        if (!A || !B) return;

        try {

            setLoading(true);

            const pair = await getPair(

                provider,

                chain.factory,

                A.address,

                B.address

            );

            if (

                pair === ethers.ZeroAddress

            ) {

                setLPBalance("0");

                return;

            }

            const lp = getPair(

                provider,

                pair

            );

            const balance =

                await lp.balanceOf(

                    address

                );

            setLPBalance(

                ethers.formatEther(balance)

            );

        }

        catch {

            setLPBalance("0");

        }

        finally {

            setLoading(false);

        }

    }

    useEffect(() => {

        refresh();

    }, [

        provider,

        address,

        tokenA,

        tokenB,

        chainId

    ]);

    return {

        lpBalance,

        refresh,

        loading

    };

}