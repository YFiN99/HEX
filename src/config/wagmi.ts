import { createConfig, http } from "wagmi";
import {
  injected,
  metaMask,
  walletConnect
} from "wagmi/connectors";

import { defineChain } from "viem";

import { CHAINS } from "./chain";

function createChain(chain: any) {
  return defineChain({
    id: chain.chainId,
    name: chain.chainName,
    nativeCurrency: {
      name: chain.nativeSymbol,
      symbol: chain.nativeSymbol,
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [chain.rpcUrl],
      },
      public: {
        http: [chain.rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: "Explorer",
        url:
          chain.explorer === ""
            ? chain.rpcUrl
            : chain.explorer,
      },
    },
  });
}

export const supportedChains = CHAINS.map(createChain);

const transports = Object.fromEntries(
  supportedChains.map((c) => [
    c.id,
    http()
  ])
);

export const wagmiConfig = createConfig({
  chains: supportedChains,

  connectors: [

    metaMask(),

    injected(),

    walletConnect({
      projectId:
        "YOUR_WALLETCONNECT_PROJECT_ID"
    }),

  ],

  transports,
});