# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing


class Justice(gl.Contract):
    verdicts: TreeMap[str, str]
    targets: TreeMap[str, str]
    reports: TreeMap[str, str]
    court_operator: Address

    def __init__(self):
        self.court_operator = gl.message.sender_address

    @gl.public.view
    def is_justice_approved(self, case_id: str) -> bool:
        return self.verdicts.get(case_id, "NONE") == "APPROVED_JUSTICE"

    @gl.public.view
    def get_case_verdict(self, case_id: str) -> str:
        v = self.verdicts.get(case_id, "NONE")
        if v == "NONE":
            return "NOT_FOUND"
        t = self.targets.get(case_id, "")
        r = self.reports.get(case_id, "")
        return v + "|" + t + "|" + r

    @gl.public.view
    def get_court_operator(self) -> str:
        return str(self.court_operator)

    @gl.public.write
    def execute_justice_scan(
        self, case_id: str, target_identifier: str, platform_type: str
    ) -> str:
        cid = case_id.strip()
        target = target_identifier.strip()
        platform = platform_type.strip().upper()

        if self.verdicts.get(cid, "NONE") != "NONE":
            return "CASE_ALREADY_ADJUDICATED"

        if platform != "HYPERLIQUID" and platform != "PUMP_FUN":
            platform = "DEX_SCREENER"

        # Pembersihan otomatis jika target berupa URL
        if "http://" in target or "https://" in target:
            target = target.rstrip("/").split("/")[-1]

        def generate_prompt_and_evidence() -> str:
            evidence = ""
            if platform == "HYPERLIQUID":
                evidence = "PLATFORM=HYPERLIQUID TARGET=" + target
            else:
                # Primary Attempt: Direct Token Endpoint
                url_direct = "https://api.dexscreener.com/latest/dex/tokens/" + target
                try:
                    res = gl.nondet.web.get(url_direct)
                    raw_text = getattr(res, "text", str(res))
                    status_code = getattr(res, "status_code", 200)

                    # Jika 404 atau pairs null, jalankan Fallback Search API
                    if status_code == 404 or '"pairs":null' in raw_text or "NotFoundError" in raw_text:
                        url_search = "https://api.dexscreener.com/latest/dex/search?q=" + target
                        res_search = gl.nondet.web.get(url_search)
                        raw_search_text = getattr(res_search, "text", str(res_search))
                        
                        if '"pairs":null' in raw_search_text or '[]' in raw_search_text:
                            evidence = "PLATFORM=" + platform + " TARGET=" + target + " STATUS=NO_ONCHAIN_DATA_FOUND"
                        else:
                            evidence = "PLATFORM=" + platform + " TARGET=" + target + " EVIDENCE_SEARCH=" + raw_search_text[:2000]
                    else:
                        evidence = "PLATFORM=" + platform + " TARGET=" + target + " EVIDENCE=" + raw_text[:2000]

                except Exception as e:
                    evidence = "PLATFORM=" + platform + " TARGET=" + target + " STATUS=API_REQUEST_FAILED"

            return (
                "You are Onchain Justice AI judge. Audit token safety from evidence.\n"
                + "Case="
                + cid
                + " Target="
                + target
                + " Platform="
                + platform
                + "\n"
                + "Evidence Data:\n"
                + evidence
                + "\n\n"
                + "Evaluate the provided evidence fairly and objectively.\n"
                + "Output must start with [VERDICT: APPROVED_JUSTICE] or [VERDICT: REJECTED_FRAUD] "
                + "then [SOURCE: "
                + target
                + "] and a short reason."
            )

        task_desc = "Adjudicate token safety for case " + cid
        criteria_desc = (
            "Must include [VERDICT: APPROVED_JUSTICE] or [VERDICT: REJECTED_FRAUD] "
            + "and [SOURCE: ...]."
        )

        judgment = gl.eq_principle.prompt_non_comparative(
            generate_prompt_and_evidence,
            task=task_desc,
            criteria=criteria_desc,
        )

        text = str(judgment)
        verdict = "REJECTED_FRAUD"
        if "APPROVED_JUSTICE" in text:
            verdict = "APPROVED_JUSTICE"

        self.verdicts[cid] = verdict
        self.targets[cid] = target
        self.reports[cid] = text
        return text