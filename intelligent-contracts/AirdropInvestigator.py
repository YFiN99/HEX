# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

class AirdropInvestigator(gl.Contract):
    user_analyses: TreeMap[str, str]
    global_last_analysis: str

    def __init__(self, initial_analysis: str = "No analysis executed yet."):
        self.global_last_analysis = initial_analysis

    @gl.public.view
    def get_user_analysis(self, user_address: str) -> str:
        clean_key = str(user_address).strip().lower()
        return self.user_analyses.get(clean_key, "No analysis found for this address.")

    @gl.public.view
    def get_last_analysis(self) -> str:
        return self.global_last_analysis

    @gl.public.write
    def investigate_and_create_content(self, target_url: str) -> str:
        sender_key = str(gl.message.sender_address).strip().lower()

        # 1. FAIL-CLOSED SCRAPING (Fixed Threshold)
        def fetch_page(url: str) -> str:
            clean_url = url.split("?_t=")[0].split("&_t=")[0]
            try:
                response = gl.nondet.web.get(
                    clean_url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                    }
                )
                status = getattr(response, "status_code", 200)
                text_content = getattr(response, "text", "") or ""

                # STRICT FAIL-CLOSED: Revert HANYA jika HTTP Status menunjukkan Error (>= 400)
                if status >= 400:
                    raise Exception(f"FETCH_FAILED_HTTP_{status}: Source blocked or not found.")

                cleaned_text = text_content.strip()
                # Jika HTTP 200 tapi konten sangat pendek/SPA client rendering
                if len(cleaned_text) == 0:
                    return f"Target URL {clean_url} returned an empty HTML body."

                return cleaned_text[:3500]
            except Exception as e:
                # Transaksi REVERT jika terjadi network error / HTTP >= 400
                raise Exception(f"FAIL_CLOSED: Source acquisition failed ({str(e)})")

        # 2. GENERATE EXACT VERDICT JSON
        def generate_content() -> str:
            raw_page_data = fetch_page(target_url)

            prompt = f"""
            You are an objective Web3 Investigator Node.
            Target URL: {target_url}
            Scraped Raw Content:
            {raw_page_data}

            Instructions:
            1. Analyze the content for valid Web3 features (dApp functions, Smart Contracts, Tokenomics, Ecosystem docs).
            2. Output MUST be a strict, valid JSON object with NO additional text or markdown code fences outside it.
            3. If valid Web3 project, set verdict to "VALIDATED". If generic/placeholder/SPA blank page, set verdict to "INVALIDATED".

            JSON Format Required:
            {{"verdict": "VALIDATED", "summary": "<Concise 80-150 word English summary of the project details found>"}}
            or
            {{"verdict": "INVALIDATED", "summary": "<Concise explanation why the project lacks verifiable Web3 mechanisms>"}}
            """
            return gl.nondet.exec_prompt(prompt)

        creative_content = gl.eq_principle.prompt_non_comparative(
            generate_content,
            task="Analyze target URL content and generate a strictly parsed JSON verdict and summary.",
            criteria="Must produce a valid JSON output containing an exact verdict ('VALIDATED' or 'INVALIDATED') and a concise summary."
        )

        # 3. STORE BY CALLER ADDRESS
        self.user_analyses[sender_key] = creative_content
        self.global_last_analysis = creative_content

        return creative_content