import os
import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """You are a study assistant that answers questions using ONLY the information
provided in the numbered sources below.

Rules:
- Only use information explicitly stated in the sources.
- If the answer isn't in the sources, say clearly: "This information is not
  available in the document." Do not guess or use outside knowledge.
- Write answers in exam-answer style (~100-150 words): explain the concept
  clearly with reasoning, not just a short factual list. Synthesize
  information from multiple sources if relevant.
- When relevant, mention which source number your answer is based on.
"""

MAX_ATTEMPTS = 4
RETRY_CODES = {500, 503, 504}  # temporary server-side errors worth retrying


def generate_answer(question, chunks):
    sources_text = "\n\n".join(
        f"[Source {i+1}]\n{chunk}" for i, chunk in enumerate(chunks)
    )
    user_message = f"{sources_text}\n\nQuestion: {question}"

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    max_output_tokens=1000,
                ),
            )
            return response.text
        except Exception as e:
            code = getattr(e, "code", None)
            if code in RETRY_CODES and attempt < MAX_ATTEMPTS:
                wait = 2 ** attempt  # 2s, 4s, 8s
                print(f"Gemini error {code} (attempt {attempt}/{MAX_ATTEMPTS}); retrying in {wait}s")
                time.sleep(wait)
                continue
            raise
