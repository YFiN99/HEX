import { Contract } from "ethers";
import HexSwapRouter from "../abi/HexSwapRouter.json";
import { BUILDER_CODE } from "../config/constants";

export function getRouter(signerOrProvider, routerAddress) {
    return new Contract(
        routerAddress,
        HexSwapRouter,
        signerOrProvider
    );
}

export async function getAmountsOut(router, amountIn, path) {
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
    // Builder Code tetap terintegrasi dan dikirim melalui router kontrak
    const tx = await router.swapExactETHForTokens(
        amountOutMin,
        path,
        to,
        deadline,
        { value }
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
    // Builder Code tetap terintegrasi
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
    // Builder Code tetap terintegrasi
    const tx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        to,
        deadline
    );
    return tx.wait();
}