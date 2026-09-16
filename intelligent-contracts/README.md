# Smart Radar — Intelligent Contracts

This folder contains the source code of the **three GenLayer Intelligent Contracts** called by the "Smart Radar" features on the HEX application (Justice Audit / Post / Ask Global AI), along with the direct mapping between each frontend method and its corresponding contract method.

Added to address the reviewer's feedback:
> "The repository does not include the Intelligent Contracts called by the Smart Radar services, so their consensus and source-verification logic cannot be reviewed."

## Contract Directory

| File | Contract Name | Address (GenLayer Studio Explorer) |
|---|---|---|
| `Justice.py` | `Justice` | [`0x4f96e2bEf5026551c284f63194758Dc4F3db1B80`](https://explorer-studio.genlayer.com/address/0x4f96e2bEf5026551c284f63194758Dc4F3db1B80) |
| `AirdropInvestigator.py` | `AirdropInvestigator` | [`0x29284Fee5503fEf697544DB73deb74D31800546d`](https://explorer-studio.genlayer.com/address/0x29284Fee5503fEf697544DB73deb74D31800546d) |
| `AIaskglobal.py` | `AIaskglobal` | [`0xd67e8388BC099FEacE26Dec23D35112AEc7fA463`](https://explorer-studio.genlayer.com/address/0xd67e8388BC099FEacE26Dec23D35112AEc7fA463) |

## Frontend ↔ Contract Mapping

### 1. "Justice Audit" Button → `Justice`

- Frontend: [`src/service/justice.ts`](../src/service/justice.ts)
- Write method called: `autoExecuteJusticeScan()` → `writeContract({ functionName: "execute_justice_scan", args: [caseId, targetIdentifier, platformType] })`
- Read methods called: `getCaseVerdict()` → `readContract({ functionName: "get_case_verdict", args: [caseId] })`, `checkIsJusticeApproved()` → `readContract({ functionName: "is_justice_approved", args: [caseId] })`
- Related contract functions: `execute_justice_scan(case_id, target_identifier, platform_type)` (write), `get_case_verdict(case_id)` (view), `is_justice_approved(case_id)` (view), `get_court_operator()` (view)
- Verdict parsing: the exact value inside the `[VERDICT: ...]` tag is parsed and compared against the two valid values (`APPROVED_JUSTICE` / `REJECTED_FRAUD`) — not a substring search across the full response, which could otherwise misfire if the AI's reasoning text happens to mention the other verdict's name in passing. Anything else (missing/malformed tag) defaults to `REJECTED_FRAUD` (fail closed).

### 2. "Post" Button → `AirdropInvestigator`

- Frontend: [`src/service/genlayerInvestigator.ts`](../src/service/genlayerInvestigator.ts)
- Write method called: `investigateUrl()` → `writeContract({ functionName: "investigate_and_create_content", args: [targetUrl] })`
- Read method called: `readAnalysisFor(targetUrl)` → `readContract({ functionName: "get_analysis_for", args: [targetUrl] })` — results are stored **per target_url** (`TreeMap[str, str]`), so concurrent investigations of different URLs by different callers can never overwrite or get mixed up with each other. `get_last_analysis()` is kept only for backward compatibility and should not be used to read a specific request's result.
- Related contract functions: `investigate_and_create_content(target_url)` (write), `get_analysis_for(target_url)` (view), `get_last_analysis()` (view, legacy)
- **Fail closed:** if `target_url` cannot be fetched after retrying, the write function raises an exception and the transaction reverts — no article is generated from placeholder/mock data. There is no synthetic fallback content for unreachable URLs.
- **Final-only display:** the frontend waits for the transaction to reach `ACCEPTED` status (`waitForTransactionReceipt`) before reading and displaying any result. It does not display content the moment the transaction merely enters the `Proposing`/`Committing` phase.

### 3. "Ask Global AI" / "Coding Chat" Button → `AIaskglobal`

- Frontend: [`src/service/askGlobal.ts`](../src/service/askGlobal.ts)
- Write method called: `askGlobalAi()` → `writeContract({ functionName: "ask_anything", args: [userQuery] })`
- Read method called: `readLatestAnswer()` → `readContract({ functionName: "get_latest_answer" })`
- History method called: `getUserHistory()` → `readContract({ functionName: "get_user_history", args: [userAddress] })`
- Related contract functions: `ask_anything(user_query)` (write), `get_latest_answer()` (view), and `get_user_history(user_address)` (view)

## Consensus Logic

All three contracts follow the same pattern for non-deterministic operations (`gl.net.get` / `gl.nondet.web.get` for web requests, `gl.nondet.exec_prompt` for LLM calls):

1. All non-deterministic operations are wrapped inside **small parameterless functions** (e.g., `generate_report()`, `generate_content()`, `generate_response()`), and are **never** called directly inside the `@gl.public.write` method body.
2. These functions are executed via **`gl.eq_principle.prompt_non_comparative(fn, task=..., criteria=...)`** — allowing validators to evaluate result similarity based on **criteria** (task fulfilled, reasonable length, proper language, natural response) rather than requiring a strict byte-for-byte match. This is crucial because LLM outputs naturally vary in phrasing on each call, even with identical prompts.
3. The consensus-approved results (`ACCEPTED`) are written to the contract storage (`self.reports` / `self.last_analysis` / `self.latest_answer` / `self.user_histories`), and can then be read by anyone via their respective `@gl.public.view` functions without requiring a wallet or gas.

## Source Verification

The source code in this folder is **identical** to the deployed source code and can be verified directly on the GenLayer Studio Explorer under the "Code" tab for each respective contract address listed above.