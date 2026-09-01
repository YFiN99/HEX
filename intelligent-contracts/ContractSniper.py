# v0.3.1 - REQUEST-BOUND, SOURCE-CITED ALPHA DETECTOR & RISK SETTLER
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
from datetime import datetime, timedelta


@allow_storage
@dataclass
class VerdictRecord:
    verdict: str          # APPROVED_FOR_LISTING | FLAGGED_HIGH_RISK | REJECTED | PENDING_SCAN
    project_name: str     # the project the verdict is about
    source_citation: str  # REQUIRED: repo full_name / URL the verdict was based on
    scan_time: u256


class ContractSniper(gl.Contract):
    # Keyed by request_id so each caller's request gets its own bound result
    # instead of one shared "latest" slot that concurrent requests can clobber.
    verdicts: TreeMap[str, VerdictRecord]

    def __init__(self):
        pass

    @gl.public.view
    def get_verdict(self, request_id: str) -> VerdictRecord:
        """Returns the verdict bound to a specific request_id (not a shared 'latest')."""
        return self.verdicts[request_id]

    @gl.public.view
    def is_approved(self, request_id: str) -> bool:
        """
        The function the DEX listing / pool-creation flow should call before
        allowing a listing or risk-sensitive action to proceed. This is what
        makes the verdict actually ENFORCE something, instead of just being
        advisory prose sitting in storage.
        """
        if request_id not in self.verdicts:
            return False
        return self.verdicts[request_id].verdict == "APPROVED_FOR_LISTING"

    @gl.public.write
    def scan_new_projects_blockchain(self, request_id: str, target_project_hint: str) -> str:
        """
        ALPHA HUNTER v0.3.0 — request-bound, source-cited exchange verdict.

        request_id: caller-supplied unique id for THIS request (e.g. a UUID or
            the pool/listing id it's meant to gate). The result is stored under
            this key, so two callers scanning concurrently never overwrite
            each other's outcome.
        target_project_hint: optional filter/context so the request is bound
            to a specific candidate rather than "whatever the AI feels like".
        """

        def fetch_with_retry(url: str, attempts: int = 3) -> str | None:
            headers = {
                "User-Agent": "GenLayer-AlphaSniper/3.0",
                "Accept": "application/json",
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
Analyze the following GitHub developer data for ultra-early crypto/blockchain projects.
Request context / hint: {target_project_hint}

{github_raw}

CRITICAL TASK:
1. Select the single best early project from the data (or state NONE if invalid).
2. Evaluate its risk level (1-10) and alpha potential (1-10).
3. Provide a strict DECISION for the decentralized exchange (DEX):
   - If alpha >= 7 and risk <= 6: [VERDICT: APPROVED_FOR_LISTING]
   - If risks are visible: [VERDICT: FLAGGED_HIGH_RISK]
   - If no good project: [VERDICT: REJECTED]
4. You MUST cite the exact source you based the decision on, using the tag
   [SOURCE: <github repo full_name, e.g. owner/repo>] immediately after the
   verdict tag. A response with no [SOURCE: ...] tag is invalid.

Format: [VERDICT: ...] [SOURCE: ...] followed by a concise execution report.
Written 100% in English.
"""
            return gl.nondet.exec_prompt(prompt)

        ai_analysis = gl.eq_principle.prompt_non_comparative(
            generate_report,
            task="Perform alpha detection and settle a source-cited exchange risk verdict for the DEX",
            criteria="""
The response must include an explicit exchange decision tag: [VERDICT: APPROVED_FOR_LISTING],
[VERDICT: FLAGGED_HIGH_RISK], or [VERDICT: REJECTED].
The response must ALSO include an explicit [SOURCE: owner/repo] citation tag naming the exact
GitHub repository the verdict is based on. A response missing the SOURCE tag must be rejected
and re-generated as [VERDICT: REJECTED] [SOURCE: NONE].
The evaluation must rely strictly on the provided GitHub development data.
Written 100% in English.
""",
        )

        record = VerdictRecord(
            verdict="REJECTED",
            project_name=target_project_hint if target_project_hint else "NONE",
            source_citation="NONE",
            scan_time=1,
        )

        if ai_analysis:
            if "APPROVED_FOR_LISTING" in ai_analysis:
                record.verdict = "APPROVED_FOR_LISTING"
            elif "FLAGGED_HIGH_RISK" in ai_analysis:
                record.verdict = "FLAGGED_HIGH_RISK"
            else:
                record.verdict = "REJECTED"

            if "[SOURCE:" in ai_analysis:
                try:
                    tail = ai_analysis.split("[SOURCE:", 1)[1]
                    citation = tail.split("]", 1)[0].strip()
                    record.source_citation = citation if citation else "NONE"
                except Exception:
                    record.source_citation = "NONE"

            # No citation => cannot be an enforceable approval, force REJECTED.
            if record.source_citation == "NONE" and record.verdict == "APPROVED_FOR_LISTING":
                record.verdict = "REJECTED"
        else:
            ai_analysis = "[VERDICT: REJECTED] [SOURCE: NONE] No qualified projects detected."

        self.verdicts[request_id] = record
        return ai_analysis