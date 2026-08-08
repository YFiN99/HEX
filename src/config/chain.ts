// src/config/chain.ts

export interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logo?: string;
    isWrappedNative?: boolean;
}

export interface Chain {
    key: string;
    chainId: number;
    chainName: string;
    rpcUrl: string;
    explorer: string;
    router: string;
    factory: string;
    wrappedNative: string;
    nativeSymbol: string;
    multicall3?: string;
    tokens: Token[];
}

export const CHAINS: Chain[] = [

    // ============================================================
    // QANTERA
    // ============================================================

    {
        key: "qantera",
        chainId: 974621,
        chainName: "Qantera",
        rpcUrl: "https://rpc1.qantera.network",
        explorer: "https://explorer.quantera.network",
        router: "0x942eaC4ba346BD396C0A449226C2Be4FEc20774E",
        factory: "0xC593F6c13123A4D300AA86244D8a7cA97fFB69d3",
        wrappedNative: "0xeD30B29a655DaDcf39B43E56c02555c2A1A9FE7E",
        nativeSymbol: "QTER",
        multicall3: "0x746913D9215c4640ABfc5793317028EB5f587b70",
        tokens: [
            {
                symbol: "QTER",
                name: "Native QTER",
                address: "native",
                decimals: 18
            },
            {
                symbol: "HEX",
                name: "HEX",
                address: "0x67905b456f9E6730FCb85A5ee477d963745e3E73",
                decimals: 18
            },
            {
                symbol: "ETH",
                name: "Wrapped Ethereum",
                address: "0xeD30B29a655DaDcf39B43E56c02555c2A1A9FE7E",
                decimals: 18
            },
            {
                symbol: "BTC",
                name: "Wrapped Bitcoin",
                address: "0x6FDeD1329dDF9790b068414c6Fb2f59Ce8516cF9",
                decimals: 8
            },
            {
                symbol: "USDT",
                name: "Tether USD",
                address: "0x392BDF692617e0317B5E8CC58d69Baf61E2e49f6",
                decimals: 6
            }
        ]
    },

    // ============================================================
    // TEQOIN
    // ============================================================

    {
        key: "teqoin",
        chainId: 420377,
        chainName: "TeQoin L2",
        rpcUrl: "https://rpc.teqoin.io",
        explorer: "https://testnet-blockscan.teqoin.io",
        router: "0x96364A65354AbF7fa7bF8F1B6197822670f320e6",
        factory: "0x8905DDb755b6D083429D62C169Add110265b561A",
        wrappedNative: "0x5E9D1C4ba94E4D078b5568B41b276fC9191AbAdb",
        nativeSymbol: "ETH",
        multicall3: "0x69F76417d06e5159986E7AD542F9B1a10784F906",
        tokens: [
            {
                symbol: "ETH",
                name: "Ether",
                address: "native",
                decimals: 18
            },
            {
                symbol: "WETH",
                name: "Wrapped Ether",
                address: "0x5E9D1C4ba94E4D078b5568B41b276fC9191AbAdb",
                decimals: 18,
                isWrappedNative: true
            },
            {
                symbol: "TEQ",
                name: "TeQoin",
                address: "0x49c2E9438Be52b88830802D7073831c1b83EcD28",
                decimals: 18
            },
            {
                symbol: "USDT",
                name: "USDT",
                address: "0xfcc025a3e170df62de0e25af7ceaf1c89abfe6e9",
                decimals: 6
            },
            {
                symbol: "USDC",
                name: "USDC",
                address: "0xe819eb5be34b20f1fec012c0daf960397a0fb386",
                decimals: 6
            },
            {
                symbol: "DAI",
                name: "DAI",
                address: "0xb96a869c74be2ed561d95a77408505371f287d16",
                decimals: 18
            }
        ]
    },

    // ============================================================
    // MACULATUS
    // ============================================================

    {
        key: "maculatus",
        chainId: 10778,
        chainName: "Maculatus Testnet",
        rpcUrl: "https://maculatus-rpc.x1eco.com/",
        explorer: "https://maculatus-scan.x1eco.com/",
        router: "0xB0aA1d29339bdFaC68a791d4C13b0698A239D97C",
        factory: "0xd6c29C74cEca823f93CeEEE6f2E958625a7Bfe00",
        wrappedNative: "0xc2F331332ca914685D773781744b1C589861C9Aa",
        nativeSymbol: "X1",
        tokens: [
            {
                symbol: "X1",
                name: "Native X1",
                address: "native",
                decimals: 18
            },
            {
                symbol: "WX1",
                name: "Wrapped X1",
                address: "0xc2F331332ca914685D773781744b1C589861C9Aa",
                decimals: 18,
                isWrappedNative: true
            },
            {
                symbol: "TKA",
                name: "Token A",
                address: "0x6cF0576a5088ECE1cbc92cbDdD2496c8de5517FB",
                decimals: 18
            },
            {
                symbol: "TKB",
                name: "Token B",
                address: "0x2C71ab7D51251BADaE2729E3F842c43fc6BB68c5",
                decimals: 18
            }
        ]
    },

    // ============================================================
    // AEREDIUM
    // ============================================================

    {
        key: "aeredium",
        chainId: 2237,
        chainName: "Aeredium Testnet",
        rpcUrl: "https://testnet.rpc.aeredium.io",
        explorer: "https://testnet.explorer.aeredium.io",
        router: "0xF8e34b12e3f0a42Fa562A19D3AfE2aDa2ab61B82",
        factory: "0x76847b66368f7cb36DC9b9f390D236Eb705B770e",
        wrappedNative: "0x6a38CF0A4A69195dE0AdDB8e95659dc3727a118E",
        nativeSymbol: "ETH",
        multicall3: "0x1aA6a0AE441400920630D43C8904DF83650E9303",
        tokens: [
            {
                symbol: "ETH",
                name: "Native ETH",
                address: "native",
                decimals: 18
            },
            {
                symbol: "WETH",
                name: "Wrapped ETH",
                address: "0x6a38CF0A4A69195dE0AdDB8e95659dc3727a118E",
                decimals: 18,
                isWrappedNative: true
            },
            {
                symbol: "HEX",
                name: "HEX",
                address: "0x46c4c389c8a3C40114b3De5499eeB58c14296A71",
                decimals: 18
            }
        ]
    }

];