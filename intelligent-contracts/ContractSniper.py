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

        # -----------------------------------------------------------
        # PENTING: operasi non-deterministik (gl.net.get, gl.nondet.exec_prompt)
        # WAJIB dipanggil dari dalam fungsi kecil TANPA parameter,
        # lalu dijalankan lewat gl.eq_principle.* -- bukan langsung
        # di body method. Tanpa ini, validator tidak bisa mencapai
        # konsensus untuk teks hasil LLM (yang selalu beda kata-kata
        # tiap kali digenerate), sehingga self.latest_report bisa
        # diam-diam gagal ter-update dan tetap nyangkut di nilai
        # awal (initial_report) selamanya.
        #
        # CATATAN TAMBAHAN soal "Undetermined":
        # Tiap validator fetch API ini SENDIRI-SENDIRI. Kalau
        # sebagian validator berhasil dapat data asli dan sebagian
        # lagi gagal (kena rate-limit/network flaky), hasil LLM-nya
        # jadi beda SECARA SUBSTANSI (bukan cuma gaya bahasa), dan
        # eq_principle tidak akan menganggap itu "cukup sama".
        # Untuk memperkecil risiko itu:
        #   1. Ditambahkan header User-Agent (GitHub API menolak
        #      request tanpa User-Agent -- ini bisa jadi penyebab
        #      semua/gagal secara tidak sengaja tidak seragam).
        #   2. Retry singkat sebelum menyerah, supaya lebih banyak
        #      validator yang akhirnya sukses fetch data yang sama.
        #   3. Semua jalur GAGAL disatukan jadi SATU teks persis
        #      yang sama, supaya validator yang sama-sama gagal
        #      tetap punya input identik untuk LLM.
        # -----------------------------------------------------------

        def fetch_with_retry(url: str, attempts: int = 3) -> str | None:

            headers = {
                "User-Agent": "GenLayer-ContractSniper/1.0",
                "Accept": "application/json"
            }

            for _ in range(attempts):
                try:
                    response = gl.nondet.web.get(url, headers=headers)
                    status = getattr(response, "status_code", 200)

                    if status < 400:
                        return response.text[:1500]

                except Exception:
                    pass

            return None

        def generate_report() -> str:

            github_url = (
                f"https://api.github.com/search/repositories?"
                f"q={target_keyword}+created:>2026-08-01&sort=updated&order=desc"
            )

            dex_url = "https://api.dexscreener.com/latest/dex/search?q=layer"

            github_raw = fetch_with_retry(github_url)
            dex_raw = fetch_with_retry(dex_url)

            # Satu teks GAGAL yang persis sama untuk semua validator
            # yang sama-sama tidak berhasil fetch -- supaya tidak ada
            # variasi antara "GitHub error 403" vs "GitHub error 429"
            # dsb yang bisa bikin LLM output beda secara substansi.
            if github_raw is None:
                github_raw = "DATA_UNAVAILABLE"

            if dex_raw is None:
                dex_raw = "DATA_UNAVAILABLE"

            prompt = f"""
            Analisis data berikut untuk mencari proyek/blockchain baru:
            GitHub: {github_raw}
            DexScreener: {dex_raw}
            Berikan laporan ringkas.

            Jika kedua sumber data di atas persis bertuliskan
            "DATA_UNAVAILABLE", jawab HANYA dengan kalimat berikut,
            persis tanpa tambahan apa pun:
            "Data sumber sedang tidak tersedia. Coba scan lagi beberapa saat lagi."
            """

            return gl.nondet.exec_prompt(prompt)

        # Validator lain menilai hasil leader berdasarkan KRITERIA
        # (bukan harus identik kata per kata), karena hasil LLM
        # memang selalu berbeda redaksinya antar validator.
        ai_analysis = gl.eq_principle.prompt_non_comparative(
            generate_report,
            task="Membuat laporan ringkas proyek blockchain & likuiditas baru dari data GitHub dan DexScreener",
            criteria="""
            Laporan berbentuk ringkasan yang jelas dan masuk akal
            Menyebutkan proyek/token yang relevan dari data yang diberikan (bukan teks generik), KECUALI jika data sumber memang tidak tersedia
            Panjangnya wajar untuk sebuah ringkasan (tidak cuma satu kata)
            """
        )

        self.latest_report = ai_analysis
        self.last_scan_time = 1

        return ai_analysis
