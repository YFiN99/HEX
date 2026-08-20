import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

import { useWallet } from "../context/WalletContext";
import EasySwapPair from "../abi/HexSwapPair.json";

export default function useReserves(pairAddressInput?: string) {

    const { provider } = useWallet();

    const [pair, setPair] = useState("");
    const [reserve0, setReserve0] = useState<bigint>(0n);
    const [reserve1, setReserve1] = useState<bigint>(0n);
    const [totalSupply, setTotalSupply] = useState<bigint>(0n);
    const [loading, setLoading] = useState(false);

    //--------------------------------------------------

    const refresh = useCallback(async () => {

        if (!provider || !pairAddressInput) {

            setPair("");
            setReserve0(0n);
            setReserve1(0n);
            setTotalSupply(0n);

            return;
        }

        try {

            setLoading(true);

            setPair(pairAddressInput);

            if (pairAddressInput === ethers.ZeroAddress) {

                setReserve0(0n);
                setReserve1(0n);
                setTotalSupply(0n);

                return;
            }

            const pairContract = new ethers.Contract(
                pairAddressInput,
                EasySwapPair,
                provider
            );

            const [reserves, supply] = await Promise.all([
                pairContract.getReserves(),
                pairContract.totalSupply()
            ]);

            setReserve0(BigInt(reserves[0].toString()));
            setReserve1(BigInt(reserves[1].toString()));
            setTotalSupply(BigInt(supply.toString()));

        } catch (err) {

            console.error("useReserves:", err);

            setReserve0(0n);
            setReserve1(0n);
            setTotalSupply(0n);

        } finally {

            setLoading(false);

        }

    }, [provider, pairAddressInput]);

    //--------------------------------------------------

    useEffect(() => {
        refresh();
    }, [refresh]);

    //--------------------------------------------------

    return {

        pair,

        pairAddress: pair,

        reserve0,

        reserve1,

        totalSupply,

        loading,

        refresh

    };

}