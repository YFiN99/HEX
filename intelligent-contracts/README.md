# Smart Radar — Intelligent Contract

This folder contains the source code of the GenLayer Intelligent Contract called by the "Justice Audit" feature on the HEX application, along with the direct mapping between the frontend method and its corresponding contract method.

## Contract Directory

| File | Contract Name | Address (GenLayer Studio Explorer) |
|---|---|---|
| `Justice.py` | `Justice` | [`0x4f96e2bEf5026551c284f63194758Dc4F3db1B80`](https://explorer-studio.genlayer.com/address/0x4f96e2bEf5026551c284f63194758Dc4F3db1B80) |

## Frontend ↔ Contract Mapping

### "Justice Audit" Button → `Justice`

- Frontend: [`src/service/justice.ts`](../src/service/justice.ts)
- Write method called: `autoExecuteJusticeScan()` → `writeContract({ functionName: "execute_justice_scan", args: [caseId, targetIdentifier, platformType] })`
- Read methods called: `getCaseVerdict()` → `readContract({ functionName: "get_case_verdict", args: [caseId] })`, `checkIsJusticeApproved()` → `readContract({ functionName: "is_justice_approved", args: [caseId] })`
- Related contract functions: `execute_justice_scan(case_id, target_identifier, platform_type)` (write), `get_case_verdict(case_id)` (view), `is_justice_approved(case_id)` (view), `get_court_operator()` (view)
- Verdict parsing: the exact value inside the `[VERDICT: ...]` tag is parsed and compared against the two valid values (`APPROVED_JUSTICE` / `REJECTED_FRAUD`) — not a substring search across the full response, which could otherwise misfire if the AI's reasoning text happens to mention the other verdict's name in passing. Anything else (missing/malformed tag) defaults to `REJECTED_FRAUD` (fail closed).

## Consensus Logic

The contract follows the standard pattern for non-deterministic operations (`gl.net.get` / `gl.nondet.web.get` for web requests, `gl.nondet.exec_prompt` for LLM calls):

1. All non-deterministic operations are wrapped inside **small parameterless functions** (e.g., `generate_report()`), and are **never** called directly inside the `@gl.public.write` method body.
2. These functions are executed via **`gl.eq_principle.prompt_non_comparative(fn, task=..., criteria=...)`** — allowing validators to evaluate result similarity based on **criteria** (task fulfilled, reasonable length, proper language, natural response) rather than requiring a strict byte-for-byte match. This is crucial because LLM outputs naturally vary in phrasing on each call, even with identical prompts.
3. The consensus-approved results (`ACCEPTED`) are written to the contract storage (`self.reports`), and can then be read by anyone via their respective `@gl.public.view` functions without requiring a wallet or gas.

## Source Verification

The source code in this folder is **identical** to the deployed source code and can be verified directly on the GenLayer Studio Explorer under the "Code" tab for the contract address listed above.