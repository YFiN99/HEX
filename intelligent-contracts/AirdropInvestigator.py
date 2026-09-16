# v0.3.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

class AirdropInvestigator(gl.Contract):
    # Hasil sekarang disimpan PER target_url (bukan satu slot global
    # `last_analysis` yang ketiban semua orang / semua request). Ini
    # ngefix race condition: 2 user investigate 2 URL beda bersamaan
    # gak akan saling nimpa/ketuker hasil lagi.
    results: TreeMap[str, str]

    # Tetep dipertahankan buat backward-compat (dashboard/monitoring
    # umum), TAPI bukan lagi sumber kebenaran buat "hasil investigasi
    # URL tertentu" -- pakai get_analysis_for(target_url) buat itu.
    last_analysis: str

    def __init__(self, initial_analysis: str):
        self.last_analysis = initial_analysis

    @gl.public.write
    def investigate_and_create_content(self, target_url: str) -> str:
        """
        Menerima URL, membaca konten web secara otomatis, menganalisis
        proyeknya, dan menghasilkan draft artikel orisinal.

        FAIL CLOSED: kalau target_url gak bisa diakses sama sekali
        (network error / timeout / status gagal di semua percobaan),
        transaksi ini akan REVERT (raise Exception) -- BUKAN lanjut
        generate artikel berdasarkan data ngarang/mock. Kalau butuh
        artikel, sumbernya harus beneran bisa diakses.
        """

        def fetch_or_none(url: str, attempts: int = 3) -> str | None:
            headers = {
                "User-Agent": "GenLayer-AirdropInvestigator/2.0"
            }

            for _ in range(attempts):
                try:
                    response = gl.nondet.web.get(url, headers=headers)
                    status = getattr(response, "status_code", 200)

                    if status < 400 and response.text and len(response.text.strip()) > 0:
                        return response.text[:3000]

                except Exception:
                    pass

            # TIDAK ADA fallback data palsu di sini. Kalau semua attempt
            # gagal, return None secara jujur -- caller yang nentuin mau
            # fail closed atau enggak.
            return None

        raw_page_data = fetch_or_none(target_url)

        if raw_page_data is None:
            # FAIL CLOSED: revert transaksi, jangan simpan apa-apa dan
            # jangan generate artikel dari data kosong/ngarang.
            raise Exception(
                f"investigate_and_create_content blocked: gagal mengambil "
                f"konten dari '{target_url}' setelah beberapa percobaan. "
                f"Transaksi dibatalkan (fail closed) -- tidak ada artikel "
                f"yang dibuat dari data yang tidak terverifikasi."
            )

        def generate_content() -> str:
            prompt = f"""
            You are an elite Web3 Research Analyst and Content Creator.
            Analyze the following raw web data from this project/airdrop URL: {target_url}

            Raw Content Snapshot:
            {raw_page_data}

            Task:
            1. Investigate and extract the core value proposition of this project.
            2. Write a highly engaging, original, human-like article draft (approx. 100-150 words) structured for a Web3 post in English.
            3. DO NOT copy the text directly. Rewrite it with a fresh, exciting angle so it sounds completely authentic and avoids generic AI detection patterns.

            Output only the final creative content text in English, formatted cleanly.
            """

            ai_response = gl.nondet.exec_prompt(prompt)
            return ai_response

        creative_content = gl.eq_principle.prompt_non_comparative(
            generate_content,
            task="Write an original Web3 promotional article (100-150 words) in English based on the target_url content",
            criteria="""
            The text length must be approximately 80-200 words in English.
            The tone must be engaging and sound human-written, not generic or robotic.
            The content must clearly refer to the actual data from target_url, not generic text applicable to any URL.
            Do not copy raw text directly from the source.
            """
        )

        # Simpan per target_url -- request/caller lain gak akan ketimpa
        # atau ketuker sama hasil ini.
        self.results[target_url] = creative_content
        self.last_analysis = creative_content

        return creative_content

    @gl.public.view
    def get_analysis_for(self, target_url: str) -> str:
        """Baca hasil investigasi utk target_url spesifik (bukan 'yang terakhir dari siapapun')."""
        return self.results.get(target_url, "")

    @gl.public.view
    def get_last_analysis(self) -> str:
        """Dipertahankan buat backward-compat. Prefer get_analysis_for()."""
        return self.last_analysis