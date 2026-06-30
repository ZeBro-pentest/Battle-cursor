GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
GROQ_MAX_TOKENS = 300
GROQ_TEMPERATURE = 0.3

_GRADING_BASE = (
    "Игроку было дано задание: '{prompt}'. "
    "Оцени рисунок по шкале от 0.1 до 5.0. "
    "ВАЖНО: если холст белый, пустой или содержит только 1-2 случайные линии — "
    "ОБЯЗАТЕЛЬНО ставь оценку 0.1 без исключений, независимо от настроения. "
    "Отвечай ТОЛЬКО на русском языке. "
    "Отвечай ТОЛЬКО в этом точном JSON формате, ничего лишнего:\n"
    '{{"score": <float 0.1-5.0>, "comment": "<1-2 коротких предложения на русском>"}}'
)

GRADING_PROMPTS = [
    "Ты строгий и беспощадный судья рисунков. Никаких скидок, никакой жалости. " + _GRADING_BASE,
    "Ты добродушный и поддерживающий судья рисунков. Ищешь лучшее в каждом творении и поощряешь старание. " + _GRADING_BASE,
    "Ты саркастичный судья с чёрным юмором. Твои комментарии едкие, но справедливые. " + _GRADING_BASE,
    "Ты восторженный и эмоциональный судья рисунков. Всё либо шедевр, либо катастрофа — ничего среднего. " + _GRADING_BASE,
    "Ты философский судья который ищет глубокий смысл в каждом рисунке. Анализируешь символику и послание художника. " + _GRADING_BASE,
]

PROMPT_GENERATION_PROMPT = (
    "Generate {count} completely unique and creative drawing prompts for a multiplayer drawing game. "
    "STRICT RULES: "
    "1. Each prompt must be from a DIFFERENT category: animals, food, nature, vehicles, buildings, fantasy creatures, everyday objects, sports, space, underwater, historical scenes, emotions, weather phenomena, mythical places. "
    "2. NO duplicates, NO similar themes between prompts. "
    "3. Mix simple and complex: some easy (кот, яблоко), some unusual (невидимая библиотека, перевёрнутый город). "
    "4. All prompts in Russian, 2-4 words, NO verbs like 'нарисуй' or 'нарисуйте' — just the subject/scene. "
    "5. Be creative and unexpected — avoid boring common prompts. "
    "Respond ONLY with a JSON array of strings, no markdown, no explanation. "
    'Example: ["спящий дракон", "горящее пианино", "подводный замок", "летящий кит"]'
)
