# Smart Radar — Intelligent Contracts

This folder contains the source code of the **three GenLayer Intelligent Contracts** called by the "Smart Radar" features on the HEX application (Justice Audit / Post / Coding), along with the direct mapping between each frontend method and its corresponding contract method.

Added to address the reviewer's feedback:
> "The repository does not include the Intelligent Contracts called by the Smart Radar services, so their consensus and source-verification logic cannot be reviewed."

## Contract Directory

| File | Contract Name | Address (GenLayer Studio) |
|---|---|---|
| `Justice.py` | `Justice` | [`0x57a931cc95bace077443161a3272295ed3cc962a`](https://explorer-studio.genlayer.com/address/0x57a931cc95bace077443161a3272295ed3cc962a) |
| `AirdropInvestigator.py` | `AirdropInvestigator` | [`0xe2771DD5b5f30D92c9443F5e4C459B91F7226924`](https://explorer-studio.genlayer.com/address/0xe2771DD5b5f30D92c9443F5e4C459B91F7226924) |
| `AIaskglobal.py` | `AIaskglobal` | [`0x40062E33d9AFbC9F0c2A7972D5C6D3Ac938dA1E3`](https://explorer-studio.genlayer.com/address/0x40062E33d9AFbC9F0c2A7972D5C6D3Ac938dA1E3) |

## Frontend ↔ Contract Mapping

### 1. "Justice Audit" Button → `Justice`

- Frontend: [`src/service/justice.ts`](../src/service/justice.ts)
- Write method called: `autoExecuteJusticeScan()` → `writeContract({ functionName: "scan_target", args: [target, source] })`
- Read method called: `getReport()` → `readContract({ functionName: "get_report", args: [target] })`
- Related contract functions: `scan_target(target, source)` (write) and `get_report(target)` (view)

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
3. The consensus-approved results (`ACCEPTED`) are written to the contract storage (`self.reports` / `self.last_analysis` / `self.latest_answer`), and can then be read by anyone via their respective `@gl.public.view` functions without requiring a wallet or gas.

## Source Verification

The source code in this folder is **identical** to the deployed source code and can be verified directly on the GenLayer Studio Explorer under the "Code" tab for each respective contract address listed above.