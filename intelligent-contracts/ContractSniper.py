# v0.2.19 - ULTRA EARLY ALPHA DETECTOR & RISK SETTLER
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from datetime import datetime, timedelta

class ContractSniper(gl.Contract):
    latest_report: str
    last_scan_time: u256
    exchange_risk_verdict: str  # Status keputusan pasti: APPROVED, FLAGGED, atau REJECTED
    target_project_name: str     # Nama proyek yang diputuskan

    def __init__(self, initial_report: str):
        self.latest_report = initial_report
        self.last_scan_time = 0
        self.exchange_risk_verdict = "PENDING_SCAN"
        self.target_project_name = "NONE"

    @gl.public.view
    def get_latest_report(self) -> str:
        return self.latest_report

    @gl.public.view
    def get_risk_verdict(self) -> str:
        """Mengembalikan keputusan mutlak on-chain untuk aturan listing/risiko DEX."""
        return self.exchange_risk_verdict

    @gl.public.write
    def scan_new_projects_blockchain(self) -> str:
        """
        ULTRA EARLY ALPHA HUNTER v0.2.19 with Request-Bound Exchange Action
        """

        def fetch_with_retry(url: str, attempts: int = 3) -> str | None:
            headers = {
                "User-Agent": "GenLayer-AlphaSniper/2.0",
                "Accept": "application/json"
            }

            for _ in range(attempts):
                try:
                    response = gl.nondet.web.get(url, headers=headers)
                    status = getattr(response, "status_code", 200)

                    if status < 400 and response.text and len(response.text.strip()) > 0:
                        return response.text[:2500]

                except Exception:
                    pass

            return None

        def generate_report() -> str:
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            github_url = (
                f"https://api.github.com/search/repositories?"
                f"q=blockchain+language:rust+OR+language:solidity+OR+language:python+"
                f"created:>{yesterday}&sort=stars&order=desc&per_page=5"
            )

            github_raw = fetch_with_retry(github_url)
            if not github_raw:
                github_raw = "[GITHUB API TIMEOUT - Using backup fallback data]"

            prompt = f"""
            Analyze the following GitHub developer data for ultra-early crypto/blockchain projects:
            {github_raw}

            CRITICAL TASK:
            1. Select the top 1 single best early project from the data (or state NONE if invalid).
            2. Evaluate its risk level (1-10) and alpha potential (1-10).
            3. Provide a strict DECISION for the decentralized exchange (DEX):
               - If alpha >= 7 and risk <= 6: Output verdict as [VERDICT: APPROVED_FOR_LISTING]
               - If risks are visible: Output verdict as [VERDICT: FLAGGED_HIGH_RISK]
               - If no good project: Output verdict as [VERDICT: REJECTED]

            Format your response clearly starting with the verdict tag, followed by a concise execution report.
            """

            return gl.nondet.exec_prompt(prompt)

        # Jalankan konsensus non-komparatif
        ai_analysis = gl.eq_principle.prompt_non_comparative(
            generate_report,
            task="Perform alpha detection and settle an exchange risk verdict for the DEX",
            criteria="""
            The response must include an explicit exchange decision tag like [VERDICT: APPROVED_FOR_LISTING], [VERDICT: FLAGGED_HIGH_RISK], or [VERDICT: REJECTED].
            The evaluation must rely strictly on the provided GitHub development data.
            Written 100% in English.
            """
        )

        if not ai_analysis or ai_analysis == "":
            ai_analysis = "[VERDICT: REJECTED] No qualified projects detected in current market scan window."
            self.exchange_risk_verdict = "REJECTED"
        else:
            # Parsing otomatis status verdict untuk disimpan sebagai state on-chain yang mengontrol DEX
            if "APPROVED_FOR_LISTING" in ai_analysis:
                self.exchange_risk_verdict = "APPROVED_FOR_LISTING"
            elif "FLAGGED_HIGH_RISK" in ai_analysis:
                self.exchange_risk_verdict = "FLAGGED_HIGH_RISK"
            else:
                self.exchange_risk_verdict = "REJECTED"

        self.latest_report = ai_analysis
        self.last_scan_time = 1

        return ai_analysis