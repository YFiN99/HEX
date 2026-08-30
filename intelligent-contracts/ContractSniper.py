# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

class ContractSniper(gl.Contract):
    latest_report: str
    last_scan_time: u256

    def __init__(self, initial_report: str):
        self.latest_report = initial_report
        self.last_scan_time = 0

    @gl.public.view
    def get_latest_report(self) -> str:
        return self.latest_report

    @gl.public.write
    def scan_new_projects_blockchain(self) -> str:

        target_keyword = "blockchain new chain"

        def fetch_with_retry(url: str, attempts: int = 3) -> str | None:
            headers = {
                "User-Agent": "GenLayer-ContractSniper/1.0",
                "Accept": "application/json"
            }

            for _ in range(attempts):
                try:
                    response = gl.nondet.web.get(url, headers=headers)
                    status = getattr(response, "status_code", 200)

                    if status < 400 and response.text and len(response.text.strip()) > 0:
                        return response.text[:1500]

                except Exception:
                    pass

            return None

        def generate_report() -> str:
            # 1. GitHub dengan filter 30 hari terakhir (Dibuat setelah 26 Juli 2026)
            github_url = (
                f"https://api.github.com/search/repositories?"
                f"q={target_keyword}+created:>2026-07-26&sort=updated&order=desc"
            )

            # 2. DexScreener untuk market & pair baru di DEX
            dex_url = "https://api.dexscreener.com/latest/dex/search?q=layer"

            # 3. Pump.fun / Launchpad Token Profiles (Latest minted profiles)
            pump_url = "https://api.dexscreener.com/token-profiles/latest/v1"

            github_raw = fetch_with_retry(github_url)
            dex_raw = fetch_with_retry(dex_url)
            pump_raw = fetch_with_retry(pump_url)

            # Uniform failure text to prevent consensus divergence across validators
            github_raw = github_raw if github_raw else "DATA_UNAVAILABLE"
            dex_raw = dex_raw if dex_raw else "DATA_UNAVAILABLE"
            pump_raw = pump_raw if pump_raw else "DATA_UNAVAILABLE"

            prompt = f"""
            You are an elite Web3 Alpha Hunter and Risk Management Analyst.
            Analyze the following live raw data streams:
            
            1. GitHub Repositories (Created within the last 30 days): {github_raw}
            2. DexScreener Market Data (Focus strictly on tokens launched within the last 24 hours / 1 day): {dex_raw}
            3. Pump.fun / Launchpad Token Profiles (Focus strictly on tokens minted within the last 24 hours / 1 day): {pump_raw}
            
            CRITICAL FILTERING RULES:
            - **Time Filter for Tokens:** You MUST strictly ignore and exclude any token, pool, or project whose creation or launch date is older than 24 hours (1 day). Only consider brand-new tokens born in the last 24 hours.
            - **Liquidity & Quality Filter:** You MUST exclude any token whose estimated liquidity or trading activity is negligible, dead, or below a safe threshold.
            - Only highlight ultra-early tokens and fresh projects that match these strict time and liquidity criteria.

            CRITICAL INSTRUCTION: You MUST write the entire response strictly in ENGLISH. Do not use any other language.

            If all data sources above are strictly equal to "DATA_UNAVAILABLE" or no projects meet the 1-day freshness and liquidity criteria, respond
            ONLY with this exact sentence and nothing else:
            "Source data is currently unavailable or no 24-hour qualified tokens met the criteria."

            Otherwise, provide a concise, high-alpha intelligence report highlighting only the qualified ultra-early tokens launched in the last 24 hours and fresh developer activity.
            """

            return gl.nondet.exec_prompt(prompt)

        # Validators evaluate the leader output based on criteria
        ai_analysis = gl.eq_principle.prompt_non_comparative(
            generate_report,
            task="Generate an ultra-early alpha intelligence report with 30-day GitHub filter and strict 1-day freshness token filter strictly in English",
            criteria="""
            The report must be written 100% in English.
            The report must strictly filter for tokens launched within the last 1 day (24 hours), exclude low-liquidity/dust tokens, and highlight active quality early projects.
            The length must be appropriate for an intelligence summary.
            """
        )

        self.latest_report = ai_analysis
        self.last_scan_time = 1

        return ai_analysis