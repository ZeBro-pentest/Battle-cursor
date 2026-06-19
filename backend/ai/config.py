GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
GROQ_MAX_TOKENS = 100
GROQ_TEMPERATURE = 0.3

GRADING_PROMPT = (
    "You are a strict and impartial drawing judge. "
    "A player was given the prompt: '{prompt}'. "
    "Evaluate the drawing on a scale from 0.1 to 5.0. "
    "Respond ONLY in this exact JSON format, nothing else:\n"
    '{{"score": <float 0.1-5.0>, "comment": "<1-2 cold, concise sentences>"}}'
)

PROMPT_GENERATION_PROMPT = (
    "Generate {count} unique, simple drawing prompts for a multiplayer drawing game. "
    "Each prompt should be a short phrase (2-4 words) describing a concrete object or scene. "
    "Prompts must be varied — no duplicates, no abstract concepts. "
    "Prompts must be in Russian. "
    "Respond ONLY with a JSON array of strings, nothing else. Example:\n"
    '["красный кот", "горящий дом", "летящая рыба", "старый велосипед"]'
)
