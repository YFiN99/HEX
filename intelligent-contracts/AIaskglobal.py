# v0.3.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class AIaskglobal(gl.Contract):
    user_histories: TreeMap[str, str]
    user_interaction_count: TreeMap[str, u256]

    latest_answer: str
    last_question: str
    total_global_interactions: u256

    def __init__(self, initial_message: str = "Halo! Silakan ajukan pertanyaan Anda."):
        self.latest_answer = initial_message
        self.last_question = "No question asked yet."
        self.total_global_interactions = u256(0)

    @gl.public.view
    def get_latest_answer(self) -> str:
        return self.latest_answer

    @gl.public.view
    def get_user_history(self, user_address: str) -> str:
        return self.user_histories.get(user_address, "")

    @gl.public.view
    def get_user_interaction_count(self, user_address: str) -> u256:
        return self.user_interaction_count.get(user_address, u256(0))

    @gl.public.write
    def ask_anything(self, user_query: str) -> str:
        sender_key = str(gl.message.sender_address)

        # 1. Ambil riwayat percakapan sebelumnya
        previous_history = self.user_histories.get(sender_key, "")
        if len(previous_history) > 600:
            previous_history = previous_history[-600:]

        # 2. Update counter interaksi
        current_count = self.user_interaction_count.get(sender_key, u256(0))
        self.user_interaction_count[sender_key] = current_count + u256(1)
        self.total_global_interactions = self.total_global_interactions + u256(1)
        self.last_question = user_query

        # 3. Jalankan LLM secara bebas dan kontekstual
        def generate_response() -> str:
            history_block = previous_history if previous_history else "None"

            prompt = f"""
            You are a helpful, friendly, and open AI assistant on GenLayer.
            You can chat freely, answer greetings, help with coding, or answer general knowledge questions.

            Previous Conversation History:
            {history_block}

            User Query:
            {user_query}

            Instructions:
            1. Respond naturally and directly to the user in their own language.
            2. If the user greets you or asks casual questions, respond in a friendly conversational way.
            3. Keep the answer clear, helpful, and under 150 words.
            """
            return gl.nondet.exec_prompt(prompt)

        # 4. Konsensus yang benar: Menghasilkan jawaban asli, bukan sekadar kata evaluasi
        answer_result = gl.eq_principle.prompt_non_comparative(
            generate_response,
            task="Generate a helpful response to the user query in their language.",
            criteria="The output must directly answer or respond to the user query in a meaningful and friendly way."
        )

        # 5. Simpan riwayat percakapan
        new_entry = f"User: {user_query}\nAI: {answer_result}"
        updated_history = f"{previous_history}\n\n{new_entry}".strip()
        
        if len(updated_history) > 1200:
            updated_history = updated_history[-1200:]

        self.user_histories[sender_key] = updated_history
        self.latest_answer = answer_result

        return answer_result