# Smart Radar — Intelligent Contracts

This folder contains the source code of the **three GenLayer Intelligent Contracts** called by the "Smart Radar" features on the HEX application (Sniper / Post / Coding), along with the direct mapping between each frontend method and its corresponding contract method.

Added to address the reviewer's feedback:
> "The repository does not include the Intelligent Contracts called by the Smart Radar services, so their consensus and source-verification logic cannot be reviewed."

## Contract Directory

| File | Contract Name | Address (GenLayer Studio) |
|---|---|---|
| `ContractSniper.py` | `ContractSniper` | [`0xfD6A06aFF3822feA1aA03E439f6ef6AD87C13610`](https://explorer-studio.genlayer.com/address/0xfD6A06aFF3822feA1aA03E439f6ef6AD87C13610) |
| `AirdropInvestigator.py` | `AirdropInvestigator` | [`0xe2771DD5b5f30D92c9443F5e4C459B91F7226924`](https://explorer-studio.genlayer.com/address/0xe2771DD5b5f30D92c9443F5e4C459B91F7226924) |
| `AIaskglobal.py` | `AIaskglobal` | [`0x40062E33d9AFbC9F0c2A7972D5C6D3Ac938dA1E3`](https://explorer-studio.genlayer.com/address/0x40062E33d9AFbC9F0c2A7972D5C6D3Ac938dA1E3) |

## Frontend ↔ Contract Mapping

### 1. "Sniper" Button → `ContractSniper`

- Frontend: [`src/service/genlayerSniper.ts`](../src/service/genlayerSniper.ts)
- Write method called: `triggerScan()` → `writeContract({ functionName: "scan_new_projects_blockchain" })`
- Read method called: `readLatestReport()` → `readContract({ functionName: "get_latest_report" })`
- Related contract functions: `scan_new_projects_blockchain()` (write) and `get_latest_report()` (view)

### 2. "Post" Button → `AirdropInvestigator`

- Frontend: [`src/service/genlayerInvestigator.ts`](../src/service/genlayerInvestigator.ts)
- Write method called: `investigateUrl()` → `writeContract({ functionName: "investigate_and_create_content", args: [targetUrl] })`
- Read method called: `readLastAnalysis()` → `readContract({ functionName: "get_last_analysis" })`
- Related contract functions: `investigate_and_create_content(target_url)` (write) and `get_last_analysis()` (view)

### 3. "Coding" / "AI Chat" Button → `AIaskglobal`

- Frontend: [`src/service/genlayerCodeAuditor.ts`](../src/service/genlayerCodeAuditor.ts)
- Write method called: `auditCode()` → `writeContract({ functionName: "ask_anything", args: [userQuery] })`
- Read method called: `readLatestAudit()` / `readLatestAnswer()` → `readContract({ functionName: "get_latest_answer" })`
- Related contract functions: `ask_anything(user_query)` (write) and `get_latest_answer()` (view)

## Consensus Logic

All three contracts follow the same pattern for non-deterministic operations (`gl.net.get` / `gl.nondet.web.get` for web requests, `gl.nondet.exec_prompt` for LLM calls):

1. All non-deterministic operations are wrapped inside **small parameterless functions** (e.g., `generate_report()`, `generate_content()`, `generate_response()`), and are **never** called directly inside the `@gl.public.write` method body.
2. These functions are executed via **`gl.eq_principle.prompt_non_comparative(fn, task=..., criteria=...)`** — allowing validators to evaluate result similarity based on **criteria** (task fulfilled, reasonable length, proper language, etc.) rather than requiring a strict byte-for-byte match. This is crucial because LLM outputs naturally vary in phrasing on each call, even with identical prompts.
3. The consensus-approved results (`ACCEPTED`) are written to the contract storage (`self.latest_report` / `self.last_analysis` / `self.latest_answer`), and can then be read by anyone via their respective `@gl.public.view` functions without requiring a wallet or gas.

## Source Verification

The source code in this folder is **identical** to the deployed source code and can be verified directly on the GenLayer Studio Explorer under the "Code" tab for each respective contract address listed above.