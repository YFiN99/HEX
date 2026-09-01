# HEX — Multi-Chain Testnet AMM DEX

HEX is a decentralized exchange (AMM) front-end that lets users swap tokens, provide liquidity, and run AI-assisted "Smart" tools across several EVM testnet chains — all from a single interface with a wallet/network selector.

Live app: **hex-amm.vercel.app**

---

## Features

- **Swap** — token-to-token swaps with live price, minimum received, price impact, and liquidity fee display.
- **Pool** — view your liquidity positions (LP balance, reserves, pool share) with Add/Remove liquidity flows.
- **Smart** — AI-assisted on-chain tools powered by [GenLayer](https://genlayer.com) Intelligent Contracts:
  - **Sniper** — scans for new projects/pairs on-chain.
  - **Post (Airdrop Investigator)** — investigates a URL and generates content/analysis.
  - **Coding / AI Chat** — general-purpose on-chain AI Q&A / code auditing.
- **Transparency** — public info page.
- **Roadmap** — project roadmap page.
- **Multi-chain selector** — no chain is selected by default; the user explicitly picks a network before Swap/Pool become active (prevents silently defaulting to one chain).