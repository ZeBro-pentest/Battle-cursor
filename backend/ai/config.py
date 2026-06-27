GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
GROQ_MAX_TOKENS = 300
GROQ_TEMPERATURE = 0.3

GRADING_PROMPT = (
    "Ты строгий судья рисунков. "
    "Игроку было дано задание: '{prompt}'. "
    "Оцени рисунок по шкале от 0.1 до 5.0. "
    "ВАЖНО: если холст практически пустой, белый или содержит только несколько случайных линий — "
    "ставь оценку 0.1 без исключений. "
    "Отвечай ТОЛЬКО на русском языке. "
    "Отвечай ТОЛЬКО в этом точном JSON формате, ничего лишнего:\n"
    '{{"score": <float 0.1-5.0>, "comment": "<1-2 коротких предложения на русском>"}}'
)

PROMPT_GENERATION_PROMPT = (
    "Generate {count} unique, creative and varied drawing prompts for a multiplayer drawing game. "
    "Each prompt should be a short phrase (2-4 words) in Russian describing a concrete object or scene. "
    "Make them diverse — mix animals, objects, food, nature, scenes. "
    "No duplicates. No abstract concepts. "
    "Respond ONLY with a JSON array of strings, nothing else. Example:\n"
    '["красный кот", "горящий дом", "летящая рыба", "старый велосипед"]'
)
