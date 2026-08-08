import { Contract } from "ethers";
import EasySwapRouter from "../abi/EasySwapRouter.json";

export function getRouter(signerOrProvider, routerAddress) {
    return new Contract(
        routerAddress,
        EasySwapRouter.abi,
        signerOrProvider
    );
}

export async function getAmountsOut(
    router,
    amountIn,
    path
) {
    return router.getAmountsOut(amountIn, path);
}

export async function swapExactETHForTokens(
    router,
    amountOutMin,
    path,
    to,
    deadline,
    value
) {
    const tx = await router.swapExactETHForTokens(
        amountOutMin,
        path,
        to,
        deadline,
        {
            value
        }
    );

    return tx.wait();
}

export async function swapExactTokensForETH(
    router,
    amountIn,
    amountOutMin,
    path,
    to,
    deadline
) {
    const tx = await router.swapExactTokensForETH(
        amountIn,
        amountOutMin,
        path,
        to,
        deadline
    );

    return tx.wait();
}

export async function swapExactTokensForTokens(
    router,
    amountIn,
    amountOutMin,
    path,
    to,
    deadline
) {
    const tx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        to,
        deadline
    );

    return tx.wait();
}

export async function addLiquidityETH(
    router,
    token,
    amountTokenDesired,
    amountTokenMin,
    amountETHMin,
    to,
    deadline,
    value
) {
    const tx = await router.addLiquidityETH(
        token,
        amountTokenDesired,
        amountTokenMin,
        amountETHMin,
        to,
        deadline,
        {
            value
        }
    );

    return tx.wait();
}

export async function removeLiquidityETH(
    router,
    token,
    liquidity,
    amountTokenMin,
    amountETHMin,
    to,
    deadline
) {
    const tx = await router.removeLiquidityETH(
        token,
        liquidity,
        amountTokenMin,
        amountETHMin,
        to,
        deadline
    );

    return tx.wait();
}