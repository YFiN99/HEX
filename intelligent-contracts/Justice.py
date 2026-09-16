# v0.3.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

class Justice(gl.Contract):
    verdicts: TreeMap[str, str]
    targets: TreeMap[str, str]
    reports: TreeMap[str, str]
    user_latest_verdict: TreeMap[str, str]
    court_operator: Address

    def __init__(self):
        self.court_operator = gl.message.sender_address

    @gl.public.view
    def is_justice_approved(self, case_id: str) -> bool:
        return self.verdicts.get(case_id, "NONE") == "APPROVED_JUSTICE"

    @gl.public.view
    def get_exact_verdict(self, case_id: str) -> str:
        """Mengembalikan SATU verdict pasti saja (APPROVED_JUSTICE / REJECTED_FRAUD / NOT_FOUND)"""
        return self.verdicts.get(case_id, "NOT_FOUND")

    @gl.public.view
    def get_case_report(self, case_id: str) -> str:
        """Mengembalikan analisis ringkas untuk case_id"""
        return self.reports.get(case_id, "Report not found.")

    @gl.public.view
    def get_user_latest_verdict(self, user_address: str) -> str:
        """Membaca verdict terakhir berdasarkan alamat caller"""
        return self.user_latest_verdict.get(user_address, "NONE")

    @gl.public.write
    def execute_justice_scan(
        self, case_id: str, target_identifier: str, platform_type: str
    ) -> str:
        cid = case_id.strip()
        target = target_identifier.strip()
        platform = platform_type.strip().upper()
        sender_key = str(gl.message.sender_address)

        if self.verdicts.get(cid, "NONE") != "NONE":
            return "CASE_ALREADY_ADJUDICATED"

        if platform != "HYPERLIQUID" and platform != "PUMP_FUN":
            platform = "DEX_SCREENER"

        if "http://" in target or "https://" in target:
            target = target.rstrip("/").split("/")[-1]

        # 1. Fetch & Verify Evidence (Strict Fail-Closed)
        def fetch_evidence() -> str:
            if platform == "HYPERLIQUID":
                return f"PLATFORM=HYPERLIQUID TARGET={target}"
            
            url_direct = f"https://api.dexscreener.com/latest/dex/tokens/{target}"
            try:
                res = gl.nondet.web.get(url_direct)
                raw_text = getattr(res, "text", str(res))
                status_code = getattr(res, "status_code", 200)

                if status_code == 404 or '"pairs":null' in raw_text or "NotFoundError" in raw_text:
                    url_search = f"https://api.dexscreener.com/latest/dex/search?q={target}"
                    res_search = gl.nondet.web.get(url_search)
                    raw_search = getattr(res_search, "text", str(res_search))

                    if '"pairs":null' in raw_search or '[]' in raw_search:
                        return "FAIL_CLOSED: NO_ONCHAIN_DATA"
                    return f"EVIDENCE_SEARCH={raw_search[:2000]}"
                
                return f"EVIDENCE={raw_text[:2000]}"
            except Exception:
                return "FAIL_CLOSED: API_FETCH_ERROR"

        # 2. Prompt Generation & Single Verdict Requirement
        def generate_judgment() -> str:
            evidence = fetch_evidence()
            
            # Direct Fail-Closed Check
            if evidence.startswith("FAIL_CLOSED"):
                return "VERDICT: REJECTED_FRAUD | Reason: On-chain source data could not be fetched or verified."

            prompt = f"""
            You are an Onchain Justice AI judge.
            Audit token safety for Target: {target} on Platform: {platform}.
            Evidence:
            {evidence}

            Instruction:
            Evaluate token safety objectively. 
            Output MUST start with EXACTLY one of these two prefixes:
            - "VERDICT: APPROVED_JUSTICE" (if liquidity and token metrics are safe)
            - "VERDICT: REJECTED_FRAUD" (if suspicious, no liquidity, or high risk)
            Followed by a single sentence explanation.
            """
            return gl.nondet.exec_prompt(prompt)

        # 3. Consensus Evaluation
        judgment = gl.eq_principle.prompt_non_comparative(
            generate_judgment,
            task=f"Adjudicate token safety for case {cid}",
            criteria="Output must start with 'VERDICT: APPROVED_JUSTICE' or 'VERDICT: REJECTED_FRAUD'."
        )

        text = str(judgment)
        
        # 4. Extract Parsed Verdict (Single Exact String)
        exact_verdict = "REJECTED_FRAUD"
        if "VERDICT: APPROVED_JUSTICE" in text or "APPROVED_JUSTICE" in text:
            exact_verdict = "APPROVED_JUSTICE"

        # 5. Save State
        self.verdicts[cid] = exact_verdict
        self.targets[cid] = target
        self.reports[cid] = text
        self.user_latest_verdict[sender_key] = exact_verdict

        return exact_verdict