import { useMemo, useState } from "react";
import { ethers } from "ethers";

import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";

import {
    getRouter,
    getAmountsOut
} from "../service/router";

export default function usePrice() {

    const { provider, chainId } = useWallet();

    const chain = useMemo(() => {

        return CHAINS.find(
            c => Number(c.chainId) === Number(chainId)
        );

    }, [chainId]);

    const [price, setPrice] = useState("--");
    const [minimumReceived, setMinimumReceived] = useState("--");
    const [priceImpact, setPriceImpact] = useState("<0.01%");

    async function quote(
        payToken,
        receiveToken,
        payAmount
    ) {

        if (!provider) return "";
        if (!chain) return "";
        if (!payAmount || Number(payAmount) <= 0) {

            setPrice("--");
            setMinimumReceived("--");
            setPriceImpact("<0.01%");

            return "";

        }

        const tokenIn = chain.tokens.find(
            t => t.symbol === payToken
        );

        const tokenOut = chain.tokens.find(
            t => t.symbol === receiveToken
        );

        if (!tokenIn || !tokenOut)
            return "";

        const tokenInAddress =
            tokenIn.address === "native"
                ? chain.wrappedNative
                : tokenIn.address;

        const tokenOutAddress =
            tokenOut.address === "native"
                ? chain.wrappedNative
                : tokenOut.address;

        try {

            const router = getRouter(
                provider,
                chain.router
            );

            const amountIn = ethers.parseUnits(
                payAmount,
                tokenIn.decimals
            );

            const amounts = await getAmountsOut(
                router,
                amountIn,
                [
                    tokenInAddress,
                    tokenOutAddress
                ]
            );

            if (!amounts || amounts.length < 2)
                return "";

            const out = ethers.formatUnits(
                amounts[amounts.length - 1],
                tokenOut.decimals
            );

            const rate =
                Number(out) / Number(payAmount);

            if (isFinite(rate)) {

                setPrice(
                    `1 ${payToken} = ${rate.toFixed(6)} ${receiveToken}`
                );

            }

            setMinimumReceived(
                (Number(out) * 0.995).toFixed(6)
            );

            setPriceImpact("<0.01%");

            return out;

        } catch (err) {

            console.error("Quote Error:", err);

            setPrice("--");
            setMinimumReceived("--");

            return "";

        }

    }

    return {

        quote,
        price,
        minimumReceived,
        priceImpact

    };

}