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
    // LITVM TESTNET
    // ============================================================

    {
        key: "litvm_testnet",
        chainId: 4441,
        chainName: "LitVM Testnet",
        rpcUrl: "https://liteforge.rpc.caldera.xyz/http",
        explorer: "https://liteforge.explorer.caldera.xyz/",
        router: "0x1B607388fA4F122469f47e4F090b9Be0553befA1",
        factory: "0x76E497041a0768bAC2F6a36Db7A1e65e8394DDe5",
        wrappedNative: "0x258c23C9149Bc95bdD052A97b803C389B582e049",
        nativeSymbol: "ETH",
        multicall3: "0x7d1B58f63c9569584AfD27DAb16EBfDb43b25626",
        tokens: [
            {
                symbol: "ETH",
                name: "Native ETH",
                address: "native",
                decimals: 18
            },
            {
                symbol: "BTC",
                name: "Bitcoin",
                address: "0xb3f1049726Ec1e4a5a6818535E0E18D7C6536d59",
                decimals: 18
            },
            {
                symbol: "USDT",
                name: "Tether USD",
                address: "0x63b00f565f309AAb8D9c97531C807E9E9cf8DDAA",
                decimals: 6
            },
            {
                symbol: "HEX",
                name: "HEX",
                address: "0x5308DA1F9Ba33226e7E1eb520e2B771bE0e30595",
                decimals: 18
            },
            {
                symbol: "HexWETH",
                name: "Hex Wrapped Ether",
                address: "0x258c23C9149Bc95bdD052A97b803C389B582e049",
                decimals: 18,
                isWrappedNative: true
            }
        ]
    },

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
            },
            {
                symbol: "WQTER",
                name: "Wrapped QTER",
                address: "0xeD30B29a655DaDcf39B43E56c02555c2A1A9FE7E",
                decimals: 18,
                isWrappedNative: true
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
        router: "0x9b64Bee4a5Cb2E05E566b83190e71007Cbc4Cb45",
        factory: "0x1089Cf5FA61ac7BD9DF2EF8E80e7769a210EE682",
        wrappedNative: "0x4384daEC7DCa5B8E19780bb35E56C75F8eC793b3",
        nativeSymbol: "ETH",
        multicall3: "0x9D212Ca95cA946228d722C06dAc23100999Cb8d7",
        tokens: [
            {
                symbol: "ETH",
                name: "Ether",
                address: "native",
                decimals: 18
            },
            {
                symbol: "TEQ",
                name: "TeQoin",
                address: "0x49c2E9438Be52b88830802D7073831c1b83EcD28",
                decimals: 18
            },
            {
                symbol: "BTC",
                name: "Bitcoin",
                address: "0x305909b8268bB8087958054FfAB1d72EAd724127",
                decimals: 18
            },
            {
                symbol: "HEX",
                name: "HEX",
                address: "0xe365b9Fe5D75680c84dceA9da3B6a736A7653082",
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
            },
            {
                symbol: "Wrapped",
                name: "Wrapped Ether",
                address: "0x4384daEC7DCa5B8E19780bb35E56C75F8eC793b3",
                decimals: 18,
                isWrappedNative: true
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
        router: "0x3E8ED20cE5D8B9C1822c66C2C805c516Beb29Aa6",
        factory: "0xBB3A990250cAACa45bB12a15F4D604A1cE500faf",
        wrappedNative: "0x73859d7d9B4fb8B88d5bd58317EE1Bc437aC60d4",
        nativeSymbol: "X1",
        multicall3: "0x35a5F4c97e10563f049780eeeB85f81ff6E5d4d2",
        tokens: [
            {
                symbol: "X1",
                name: "Native X1",
                address: "native",
                decimals: 18
            },
            {
                symbol: "BTC",
                name: "Bitcoin",
                address: "0x547290b671d6768F14cFE448C565c29A75c3A902",
                decimals: 18
            },
            {
                symbol: "USDT",
                name: "Tether USD",
                address: "0x0018B0285FF89275A38B88B78Da0aAbB0Bb317BB",
                decimals: 6
            },
            {
                symbol: "HEX",
                name: "HEX",
                address: "0x743B962cba7A7d078dAa54B486D8fe0B59d4823c",
                decimals: 18
            },
            {
                symbol: "WX1",
                name: "Wrapped X1",
                address: "0x73859d7d9B4fb8B88d5bd58317EE1Bc437aC60d4",
                decimals: 18,
                isWrappedNative: true
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
                symbol: "HEX",
                name: "HEX",
                address: "0x46c4c389c8a3C40114b3De5499eeB58c14296A71",
                decimals: 18
            },
            {
                symbol: "WETH",
                name: "Wrapped ETH",
                address: "0x6a38CF0A4A69195dE0AdDB8e95659dc3727a118E",
                decimals: 18,
                isWrappedNative: true
            }
        ]
    }

];