GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct-fp8"
GROQ_MAX_TOKENS = 100
GROQ_TEMPERATURE = 0.3

GRADING_PROMPT = (
    "You are a strict and impartial drawing judge. "
    "A player was given the prompt: '{prompt}'. "
    "Evaluate the drawing on a scale from 0.1 to 5.0. "
    "Respond ONLY in this exact JSON format, nothing else:\n"
    '{{"score": <float 0.1-5.0>, "comment": "<1-2 cold, concise sentences>"}}'
)
