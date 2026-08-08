import { useMemo } from "react";

import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";

import {
    getToken,
    allowance,
    approve
} from "../service/token";

export default function useAllowance() {

    const {

        signer,
        address,
        chainId

    } = useWallet();

    const chain = useMemo(() => {

        return CHAINS.find(

            c => c.chainId === chainId

        );

    }, [chainId]);

    async function checkAllowance(

        token: string,

        amount: bigint

    ) {

        if (!signer)
            throw new Error("Wallet not connected");

        if (!chain)
            throw new Error("Unsupported chain");

        const erc20 = getToken(

            signer,

            token

        );

        const value = await allowance(

            erc20,

            address,

            chain.router

        );

        return value >= amount;

    }

    async function approveToken(

        token: string,

        amount: bigint

    ) {

        if (!signer)
            throw new Error("Wallet not connected");

        if (!chain)
            throw new Error("Unsupported chain");

        const erc20 = getToken(

            signer,

            token

        );

        await approve(

            erc20,

            chain.router,

            amount

        );

    }

    return {

        checkAllowance,

        approveToken

    };

}