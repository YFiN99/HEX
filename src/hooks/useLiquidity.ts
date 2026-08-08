import { Contract, ethers } from "ethers";

import { useWallet } from "../context/WalletContext";
import { CHAINS } from "../config/chain";

import EasySwapRouter from "../abi/EasySwapRouter.json";
import EasySwapPair from "../abi/EasySwapPair.json";
import MockERC20 from "../abi/MockERC20.json";
import Hex from "../abi/Hex.json";

export function useLiquidity() {

    const {
        signer,
        provider,
        chainId,
        address
    } = useWallet();

    //------------------------------------------------
    // GET CHAIN
    //------------------------------------------------

    function getChain() {

        const chain = CHAINS.find(
            c => c.chainId === chainId
        );

        if (!chain) {
            throw new Error(
                `Unsupported chain: ${chainId}`
            );
        }

        return chain;
    }

    //------------------------------------------------
    // GET ROUTER
    //------------------------------------------------

    function getRouter() {

        if (!signer) {
            throw new Error(
                "Wallet not connected"
            );
        }

        const chain = getChain();

        if (!chain.router) {
            throw new Error(
                "Router address is missing"
            );
        }

        return new Contract(
            chain.router,
            EasySwapRouter.abi,
            signer
        );
    }

    //------------------------------------------------
    // GET TOKEN
    //------------------------------------------------

    function getToken(
        token: string,
        isHex = false
    ) {

        if (!signer) {
            throw new Error(
                "Wallet not connected"
            );
        }

        if (!token) {
            throw new Error(
                "Token address is missing"
            );
        }

        return new Contract(
            token,
            isHex
                ? Hex.abi
                : MockERC20.abi,
            signer
        );
    }

    //------------------------------------------------
    // APPROVE TOKEN
    //------------------------------------------------

    async function approve(
        token: string,
        amount: bigint,
        isHex = false
    ) {

        if (!address) {
            throw new Error(
                "Wallet address missing"
            );
        }

        const chain = getChain();

        const contract = getToken(
            token,
            isHex
        );

        const allowance =
            await contract.allowance(
                address,
                chain.router
            );

        if (allowance >= amount) {
            return;
        }

        const tx =
            await contract.approve(
                chain.router,
                ethers.MaxUint256
            );

        return await tx.wait();
    }

    //------------------------------------------------
    // ADD TOKEN + ETH
    //------------------------------------------------

    async function addLiquidityETH(
        token: string,
        tokenAmount: bigint,
        nativeAmount: bigint
    ) {

        if (!provider) {
            throw new Error(
                "Provider missing"
            );
        }

        if (!address) {
            throw new Error(
                "Wallet address missing"
            );
        }

        const router =
            getRouter();

        const block =
            await provider.getBlock(
                "latest"
            );

        if (!block) {
            throw new Error(
                "Unable to get latest block"
            );
        }

        const deadline =
            Number(block.timestamp) + 1800;

        const tx =
            await router.addLiquidityETH(

                token,

                tokenAmount,

                0,

                0,

                address,

                deadline,

                {
                    value: nativeAmount
                }

            );

        return await tx.wait();
    }

    //------------------------------------------------
    // ADD TOKEN + TOKEN
    //------------------------------------------------

    async function addLiquidity(
        tokenA: string,
        tokenB: string,
        amountA: bigint,
        amountB: bigint
    ) {

        if (!provider) {
            throw new Error(
                "Provider missing"
            );
        }

        if (!address) {
            throw new Error(
                "Wallet address missing"
            );
        }

        const router =
            getRouter();

        const block =
            await provider.getBlock(
                "latest"
            );

        if (!block) {
            throw new Error(
                "Unable to get latest block"
            );
        }

        const deadline =
            Number(block.timestamp) + 1800;

        const tx =
            await router.addLiquidity(

                tokenA,

                tokenB,

                amountA,

                amountB,

                0,

                0,

                address,

                deadline

            );

        return await tx.wait();
    }

    //------------------------------------------------
    // REMOVE TOKEN + ETH
    //------------------------------------------------

    async function removeLiquidityETH(
        token: string,
        liquidity: bigint,
        pairAddress?: string
    ) {

        if (!provider) {
            throw new Error(
                "Provider missing"
            );
        }

        if (!signer) {
            throw new Error(
                "Signer missing"
            );
        }

        if (!address) {
            throw new Error(
                "Wallet address missing"
            );
        }

        if (!token) {
            throw new Error(
                "Token address is missing"
            );
        }

        if (!pairAddress) {
            throw new Error(
                "Pair address is missing"
            );
        }

        if (
            pairAddress ===
            ethers.ZeroAddress
        ) {
            throw new Error(
                "Invalid pair address"
            );
        }

        if (liquidity <= 0n) {
            throw new Error(
                "Liquidity amount must be greater than zero"
            );
        }

        //------------------------------------------------
        // CHAIN
        //------------------------------------------------

        const chain =
            getChain();

        //------------------------------------------------
        // ROUTER
        //------------------------------------------------

        const router =
            getRouter();

        //------------------------------------------------
        // LP TOKEN CONTRACT
        //------------------------------------------------

        const lpContract =
            new Contract(

                pairAddress,

                EasySwapPair.abi,

                signer

            );

        //------------------------------------------------
        // CHECK LP BALANCE
        //------------------------------------------------

        const lpBalance =
            await lpContract.balanceOf(
                address
            );

        if (lpBalance < liquidity) {

            throw new Error(
                "Insufficient LP token balance"
            );

        }

        //------------------------------------------------
        // LP ALLOWANCE
        //------------------------------------------------

        const allowance =
            await lpContract.allowance(

                address,

                chain.router

            );

        //------------------------------------------------
        // APPROVE LP
        //------------------------------------------------

        if (allowance < liquidity) {

            const approveTx =
                await lpContract.approve(

                    chain.router,

                    ethers.MaxUint256

                );

            await approveTx.wait();

        }

        //------------------------------------------------
        // DEADLINE
        //------------------------------------------------

        const block =
            await provider.getBlock(
                "latest"
            );

        if (!block) {
            throw new Error(
                "Unable to get latest block"
            );
        }

        const deadline =
            Number(block.timestamp) + 1800;

        //------------------------------------------------
        // REMOVE LIQUIDITY
        //------------------------------------------------

        const tx =
            await router.removeLiquidityETH(

                token,

                liquidity,

                0,

                0,

                address,

                deadline

            );

        //------------------------------------------------
        // WAIT TRANSACTION
        //------------------------------------------------

        return await tx.wait();
    }

    //------------------------------------------------

    return {

        approve,

        addLiquidity,

        addLiquidityETH,

        removeLiquidityETH

    };
}