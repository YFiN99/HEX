import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers, Contract } from "ethers";

import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";

import EasySwapFactory from "../abi/EasySwapFactory.json";
import EasySwapPair from "../abi/EasySwapPair.json";
import MockERC20 from "../abi/MockERC20.json";

export default function usePosition() {

    const {
        provider,
        address,
        chainId
    } = useWallet();

    const chain = useMemo(
        () => CHAINS.find(c => c.chainId === chainId),
        [chainId]
    );

    const [position, setPosition] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    //------------------------------------------------------

    const refresh = useCallback(async () => {

        if (!provider || !address || !chain) {
            setPosition(null);
            return;
        }

        try {

            setLoading(true);

            const factory = new Contract(
                chain.factory,
                EasySwapFactory.abi,
                provider
            );

            for (const token of chain.tokens) {

                if (
                    token.address === "native" ||
                    token.address.toLowerCase() === chain.wrappedNative.toLowerCase()
                ) {
                    continue;
                }

                const pairAddress = await factory.getPair(
                    token.address,
                    chain.wrappedNative
                );

                if (
                    !pairAddress ||
                    pairAddress === ethers.ZeroAddress
                ) {
                    continue;
                }

                const pair = new Contract(
                    pairAddress,
                    EasySwapPair.abi,
                    provider
                );

                const lp = await pair.balanceOf(address);

                if (lp === 0n) {
                    continue;
                }

                const tokenContract = new Contract(
                    token.address,
                    MockERC20.abi,
                    provider
                );

                const decimals = await tokenContract.decimals();

                setPosition({

                    token: token.address,

                    symbol: token.symbol,

                    pair: pairAddress,

                    lp: BigInt(lp),

                    decimals: Number(decimals)

                });

                return;
            }

            setPosition(null);

        }
        catch (err) {

            console.error(err);

            setPosition(null);

        }
        finally {

            setLoading(false);

        }

    }, [
        provider,
        address,
        chain
    ]);

    //------------------------------------------------------

    useEffect(() => {
        refresh();
    }, [refresh]);

    //------------------------------------------------------

    return {

        position,

        loading,

        refresh

    };

}