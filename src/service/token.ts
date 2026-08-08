import { Contract } from "ethers";

import MockERC20 from "../abi/MockERC20.json";

export function getToken(

    signerOrProvider: any,

    tokenAddress: string

) {

    return new Contract(

        tokenAddress,

        MockERC20.abi,

        signerOrProvider

    );

}

export async function name(

    token: Contract

) {

    return await token.name();

}

export async function symbol(

    token: Contract

) {

    return await token.symbol();

}

export async function decimals(

    token: Contract

) {

    return Number(

        await token.decimals()

    );

}

export async function totalSupply(

    token: Contract

) {

    return await token.totalSupply();

}

export async function balanceOf(

    token: Contract,

    account: string

) {

    return await token.balanceOf(

        account

    );

}

export async function allowance(

    token: Contract,

    owner: string,

    spender: string

) {

    return await token.allowance(

        owner,

        spender

    );

}

export async function approve(

    token: Contract,

    spender: string,

    amount: bigint

) {

    const tx = await token.approve(

        spender,

        amount

    );

    return tx.wait();

}

export async function transfer(

    token: Contract,

    to: string,

    amount: bigint

) {

    const tx = await token.transfer(

        to,

        amount

    );

    return tx.wait();

}

export async function transferFrom(

    token: Contract,

    from: string,

    to: string,

    amount: bigint

) {

    const tx = await token.transferFrom(

        from,

        to,

        amount

    );

    return tx.wait();

}

export async function mint(

    token: Contract,

    to: string,

    amount: bigint

) {

    const tx = await token.mint(

        to,

        amount

    );

    return tx.wait();

}

export async function burn(

    token: Contract,

    amount: bigint

) {

    const tx = await token.burn(

        amount

    );

    return tx.wait();

}