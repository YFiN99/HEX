# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

class AIaskglobal(gl.Contract):
    latest_answer: str
    last_question: str
    interaction_count: u256

    def __init__(self, initial_message: str = "Halo! Silakan ajukan pertanyaan atau masalah Anda ke AI Assistant."):
        self.latest_answer = initial_message
        self.last_question = "No question asked yet."
        self.interaction_count = 0

    @gl.public.view
    def get_latest_answer(self) -> str:
        return self.latest_answer

    @gl.public.write
    def ask_anything(self, user_query: str) -> str:
        self.last_question = user_query
        self.interaction_count += 1

        def generate_response() -> str:
            prompt = f"""
            You are a universal, highly intelligent, and flexible global AI assistant on GenLayer.
            You can answer any question, solve any problem, provide explanations, write code, translate languages, 
            give advice, or analyze text in any human programming or natural language.
            
            User's Query / Problem:
            --- QUERY START ---
            {user_query}
            --- QUERY END ---
            
            CRITICAL INSTRUCTIONS:
            1. **Flexibility & Completeness:** Answer the user's query comprehensively, accurately, and helpfully, regardless of the topic.
            2. **Multi-Language Support:** Respond in the **same language** the user used in their query (Indonesian, English, etc.).
            3. **Clarity & Structure:** Format your response clearly using markdown for readability.
            """
            return gl.nondet.exec_prompt(prompt)

        # Gunakan prompt_non_comparative agar diizinkan oleh validator consensus GenLayer
        answer_result = gl.eq_principle.prompt_non_comparative(
            generate_response,
            task="Provide an accurate, helpful, and comprehensive answer to the user's query in their preferred language.",
            criteria="""
            The response must directly and accurately address the user's query or problem.
            The language of the response must match the language used by the user in their prompt.
            The explanation or solution must be clear, logical, and helpful.
            """
        )

        self.latest_answer = answer_result
        return answer_result
