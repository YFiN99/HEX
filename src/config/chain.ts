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
    sniperPair?: string;
    tokens: Token[];
}

export const CHAINS: Chain[] = [

    // ============================================================
    // TEQOIN
    // ============================================================

    {
        key: "teqoin",
        chainId: 420377,
        chainName: "TeQoin",
        rpcUrl: "https://rpc.teqoin.io",
        explorer: "https://testnet-blockscan.teqoin.io",
        router: "0x67eef973A9dE224137590262EA12cebdB7f4E99b",
        factory: "0x38f2BaEc058c98c78C4f4CAE517F823Fd5E2BA0C",
        wrappedNative: "0x06E209833e4E7715e534e45917febBeA94E80Cc0",
        nativeSymbol: "ETH",
        multicall3: "0xBe662F5C152DFcAacAB05Eccfb151cfaFE882895",
        sniperPair: "0xe67F2aC1ad016F16Ef97EE46f64f9B3ead60DD0A",
        tokens: [
            {
                symbol: "ETH",
                name: "Ether",
                address: "native",
                decimals: 18
            },
            {
                symbol: "BTC",
                name: "Bitcoin",
                address: "0x82E7A3CCbAfCBE0E56dAa7F0e3CE7B696F3DBf79",
                decimals: 18
            },
            {
                symbol: "HEX",
                name: "HEX",
                address: "0x94561e9939cfB096b1490B34733cebDE107d89bE",
                decimals: 18
            },
            {
                symbol: "USDT",
                name: "USDT",
                address: "0x89eb90ea576ab0b207e2d596CFa3C06B78645744",
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
                symbol: "WETH",
                name: "Wrapped Ether",
                address: "0x06E209833e4E7715e534e45917febBeA94E80Cc0",
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
        router: "0x9367592051262f789Ad56B519E1751a36028a04F",
        factory: "0x421200350e4e2Be72BA22DDab010028e73C3050b",
        wrappedNative: "0x0011783253914B2C53398176105f4C206043a15e",
        nativeSymbol: "QTER",
        multicall3: "0x364E8F0AB3AB7A5b250d958dfAEaB42956dDEF7F",
        sniperPair: "0x7F97298Ba887e7f95162c230Aa6F9870998139E1",
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
                address: "0x2F5f1E4745B673317AC3e269A6fCCFe82443F87a",
                decimals: 18
            },
            {
                symbol: "BTC",
                name: "Bitcoin",
                address: "0xE4A718043e90aF01F520e390f137426382551d63",
                decimals: 18
            },
            {
                symbol: "USDT",
                name: "Tether USD",
                address: "0xa3cDD0daC80c263eE9ba43ebBaabFB17B7FAf0bf",
                decimals: 6
            },
            {
                symbol: "WQTER",
                name: "Wrapped QTER",
                address: "0x0011783253914B2C53398176105f4C206043a15e",
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
        chainName: "X1 (X1)",
        rpcUrl: "https://maculatus-rpc.x1eco.com/",
        explorer: "https://maculatus-scan.x1eco.com/",
        router: "0xfBAcCAF9B35AD2447f53A5d665E902d0de3b9747",
        factory: "0xeF33f7F3194538f7A93A0db8AD117aDe7A2fF6b4",
        wrappedNative: "0x13a674e5A2eAf4E19854F1382Fe0da06B076d546",
        nativeSymbol: "X1",
        multicall3: "0x0Ff96c5c80C383C15511A7f8AA29cC44D50b7Deb",
        sniperPair: "0x17d999Fd87b6Cb7C1f83c447d93EF50e10D80C54",
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
                address: "0xA34b1Dd8C963a26149c8a6174DC8280AF07F2EBd",
                decimals: 18
            },
            {
                symbol: "HEX",
                name: "HEX",
                address: "0xb9e7BC6BF559B3b219580cCD8041dD964E2f33E2",
                decimals: 18
            },
            {
                symbol: "USDT",
                name: "Tether USD",
                address: "0x69F5A2b61EB0371bEE7A0fF373706d3bFf5D34F8",
                decimals: 6
            },
            {
                symbol: "WX1",
                name: "Wrapped X1",
                address: "0x13a674e5A2eAf4E19854F1382Fe0da06B076d546",
                decimals: 18,
                isWrappedNative: true
            }
        ]
    },

    // ============================================================
    // LITVM TESTNET
    // ============================================================

    {
        key: "litvm_testnet",
        chainId: 4441,
        chainName: "LitVM Testnet",
        rpcUrl: "https://liteforge.rpc.caldera.xyz/http",
        explorer: "https://liteforge.explorer.caldera.xyz/",
        router: "0xE4C47e2Ca4b53F87e5E015D9C4745158a8A563B2",
        factory: "0x6A2fF9D8B97774Ef73f9aa7859C5e147d4C34961",
        wrappedNative: "0xDaD1e2E48C08dC80F10db72DBeF2afbFdA1eB751",
        nativeSymbol: "ETH",
        multicall3: "0x05ECADF5D07f94e4533bEBa56d883f920cDC19e6",
        sniperPair: "0xb503D7D61687a8C748BF253eC89Fd176a21B7538",
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
                address: "0x2Fe9344EB404DF67B8CF9d1a3ACaAA646d706304",
                decimals: 18
            },
            {
                symbol: "USDT",
                name: "Tether USD",
                address: "0x2B904ceb0bc91e3082553A71bDa99808e1F5535a",
                decimals: 6
            },
            {
                symbol: "HEX",
                name: "HEX",
                address: "0x5c1335cD9ad845CD13d3516aAE47D4Da574F4E57",
                decimals: 18
            },
            {
                symbol: "HexWETH",
                name: "Hex Wrapped Ether",
                address: "0xDaD1e2E48C08dC80F10db72DBeF2afbFdA1eB751",
                decimals: 18,
                isWrappedNative: true
            }
        ]
    },

    // ============================================================
    // SOLAR
    // ============================================================

    {
        key: "solar",
        chainId: 804223,
        chainName: "Solar Testnet",
        rpcUrl: "https://rpc-testnet.solarious.io/",
        explorer: "",
        router: "0xB7Ca774ecA1E5749635DbBf5626D2f65D871E8Da",
        factory: "0x001f475F4Dcf107ed47d9bC4ED991492600C7E97",
        wrappedNative: "0xD09A05d5a08DB606F720124FAf25ABB83742139c",
        nativeSymbol: "ETH",
        multicall3: "0x8059190e13d13bF4e5844C17D052681d89f80A49",
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
                address: "0x1212f404136DcB1344CE061822545e8De15E3227",
                decimals: 18
            },
            {
                symbol: "USDT",
                name: "Tether USD",
                address: "0xBF2f9E7FD252798d27301E1EEC9E6cCb978fd32E",
                decimals: 6
            },
            {
                symbol: "HEX",
                name: "HEX",
                address: "0xb25859b5c4cA04268b1Dd00a419b2941E2269dD0",
                decimals: 18
            },
            {
                symbol: "WETH",
                name: "Wrapped ETH",
                address: "0xD09A05d5a08DB606F720124FAf25ABB83742139c",
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