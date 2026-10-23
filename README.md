# HEX — Multi-Chain Testnet AMM DEX with GenLayer Smart Radar

HEX is a decentralized exchange (AMM) front-end that allows users to swap tokens, provide liquidity, and run autonomous risk audits via GenLayer Intelligent Contracts — all from a unified dark-themed interface.

**Live App:** [https://hex-amm.vercel.app](https://hex-amm.vercel.app)

---

## 🚀 Key Features

* **Swap** — Fast token-to-token swaps featuring default token pairs (`HEX` / `USDT`), live price estimates, minimum received, price impact, and liquidity fee display.
* **Pool** — Manage liquidity positions (LP balance, reserves, pool share) with streamlined Add/Remove liquidity flows.
* **Smart Radar (GenLayer Integration)** — On-chain AI token audit powered strictly by the **`Justice.py`** Intelligent Contract:
  * **Justice Audit:** Scans contract addresses or token symbols on-chain and returns consensus-backed verdicts (`APPROVED_JUSTICE` or `REJECTED_FRAUD`).
* **Multi-Chain Selector** — Explicit network switching and wallet provider integration.
* **Info & Roadmap** — Complete project transparency and future development roadmap.

---

## 🧠 GenLayer Intelligent Contract

* **Primary Contract:** `Justice.py`
* **Deployed Address:** `0x4f96e2bEf5026551c284f63194758Dc4F3db1B80`
* **Consensus Mechanism:** Uses GenLayer's non-deterministic equivalence principle (`gl.eq_principle.prompt_non_comparative`) for multi-validator agreement over web evidence.

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite, Viem / Ethers.js
* **Smart Contracts / Engine:** Solidity (Uniswap V2 Router/Factory basis) & GenLayer Intelligent Contracts (Python)
* **Styling:** Custom CSS with Electric Cyan & Gold dark aesthetics