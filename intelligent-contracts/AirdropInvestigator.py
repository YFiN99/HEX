# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

class AirdropInvestigator(gl.Contract):
    # Deklarasikan field yang akan disimpan di blockchain
    last_analysis: str

    # Konstruktor wajib ada untuk inisialisasi awal
    def __init__(self, initial_analysis: str):
        self.last_analysis = initial_analysis

    # Fungsi publik untuk menulis dan memproses investigasi web secara otonom
    @gl.public.write
    def investigate_and_create_content(self, target_url: str) -> str:
        """
        Menerima URL, membaca isi web secara otonom, menganalisis proyeknya,
        dan meracik artikel orisinal untuk kebutuhan YAPING.
        """

        # -----------------------------------------------------------
        # PENTING: gl.net.get() dan gl.nondet.exec_prompt() (operasi non-deterministik)
        # WAJIB dipanggil dari dalam fungsi kecil TANPA parameter, lalu
        # dijalankan lewat gl.eq_principle.* -- bukan dipanggil langsung
        # di body method. Tanpa ini, validator-validator GenLayer tidak
        # bisa mencapai konsensus untuk teks kreatif (yang memang selalu
        # beda kata-katanya tiap kali di-generate), sehingga penulisan
        # ke self.last_analysis bisa diam-diam gagal / tidak ter-update.
        #
        # Sama seperti ContractSniper: ditambahkan header User-Agent,
        # retry singkat, dan SATU teks gagal yang persis sama untuk
        # semua validator yang sama-sama gagal fetch -- supaya risiko
        # hasil "Undetermined" (validator tidak sepakat) diperkecil.
        # -----------------------------------------------------------

        def fetch_with_retry(url: str, attempts: int = 3) -> str | None:

            headers = {
                "User-Agent": "GenLayer-AirdropInvestigator/1.0"
            }

            for _ in range(attempts):
                try:
                    response = gl.nondet.web.get(url, headers=headers)
                    status = getattr(response, "status_code", 200)

                    if status < 400 and response.text and len(response.text.strip()) > 0:
                        return response.text[:3000]

                except Exception:
                    pass

            return None

        def generate_content() -> str:

            raw_page_data = fetch_with_retry(target_url)

            if raw_page_data is None:
                raw_page_data = "DATA_UNAVAILABLE"

            prompt = f"""
            You are an elite Web3 Research Analyst and Content Creator.
            Analyze the following raw web data from this project/airdrop URL: {target_url}

            Raw Content Snapshot:
            {raw_page_data}

            Task:
            1. Investigate and extract the core value proposition of this project.
            2. Write a highly engaging, original, human-like article draft (approx. 100-150 words) structured for a Web3 post.
            3. DO NOT copy the text directly. Rewrite it with a fresh, exciting angle so it sounds completely authentic and avoids generic AI detection patterns.

            If the Raw Content Snapshot above is exactly "DATA_UNAVAILABLE", respond
            ONLY with this exact sentence and nothing else:
            "Halaman target tidak bisa diakses saat ini. Coba lagi beberapa saat lagi."

            Output only the final creative content text, formatted cleanly.
            """

            return gl.nondet.exec_prompt(prompt)

        # Validator lain menilai hasil leader berdasarkan KRITERIA
        # (bukan harus sama persis kata per kata), karena tulisan
        # kreatif memang tidak akan pernah identik antar validator.
        creative_content = gl.eq_principle.prompt_non_comparative(
            generate_content,
            task="Menulis artikel promosi Web3 yang orisinal (100-150 kata) berdasarkan isi halaman target_url",
            criteria="""
            Panjang teks kira-kira 80-200 kata, KECUALI jika halaman target memang tidak bisa diakses
            Nada tulisan engaging dan terdengar seperti ditulis manusia, bukan generik/robotic
            Isinya jelas merujuk ke konten asli dari target_url, bukan teks generik yang bisa dipakai untuk URL apa saja
            Tidak menyalin mentah-mentah dari sumber aslinya
            """
        )

        # Simpan ke state kontrak
        self.last_analysis = creative_content

        return creative_content

    @gl.public.view
    def get_last_analysis(self) -> str:
        return self.last_analysis
