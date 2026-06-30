import { useState, useCallback } from "react";

const RIDDLES = [
  { q: "Что имеет руки, но не может хлопать?",        a: "Часы",      opts: ["Часы", "Робот", "Статуя", "Манекен"] },
  { q: "Чем больше берёшь, тем больше становится?",   a: "Яма",       opts: ["Яма", "Долг", "Усталость", "Мусор"] },
  { q: "Без окон, без дверей, полна горница людей?",  a: "Огурец",    opts: ["Огурец", "Тыква", "Арбуз", "Бочка"] },
  { q: "Зимой и летом одним цветом?",                 a: "Ёлка",      opts: ["Ёлка", "Трава", "Небо", "Снег"] },
  { q: "Что можно увидеть с закрытыми глазами?",      a: "Сон",       opts: ["Сон", "Темноту", "Мысли", "Ничего"] },
  { q: "Не лает, не кусает, а в дом не пускает?",    a: "Замок",     opts: ["Замок", "Забор", "Дверь", "Охранник"] },
  { q: "Что всегда перед тобой, но не увидишь?",     a: "Будущее",   opts: ["Будущее", "Нос", "Лоб", "Воздух"] },
  { q: "Два кольца, два конца, а посередине гвоздик?", a: "Ножницы", opts: ["Ножницы", "Очки", "Цепь", "Скрепка"] },
  { q: "Всегда голодна, а накормишь — умирает?",     a: "Огонь",     opts: ["Огонь", "Акула", "Яма", "Дыра"] },
  { q: "Чем больше сохнет, тем мокрее?",             a: "Полотенце", opts: ["Полотенце", "Земля", "Губка", "Тряпка"] },
];

function pickRiddle(exclude?: typeof RIDDLES[number]) {
  const pool = exclude ? RIDDLES.filter((r) => r !== exclude) : RIDDLES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function RiddleEffect({ onComplete }: { onComplete: () => void }) {
  const [riddle, setRiddle] = useState(() => pickRiddle());
  const [wrong, setWrong] = useState<string | null>(null);

  const pick = useCallback(
    (opt: string) => {
      if (opt === riddle.a) {
        onComplete();
      } else {
        setWrong(opt);
        setTimeout(() => {
          setWrong(null);
          setRiddle((prev) => pickRiddle(prev));
        }, 800);
      }
    },
    [riddle, onComplete],
  );

  return (
    <div className="effect-epic-overlay">
      <div className="effect-epic-box">
        <p className="effect-epic-title">Загадка</p>
        <p className="effect-epic-text">{riddle.q}</p>
        <div className="effect-quiz-options">
          {riddle.opts.map((opt) => (
            <button
              key={opt}
              className={`effect-epic-btn effect-quiz-opt${wrong === opt ? " effect-quiz-opt--wrong" : ""}`}
              onClick={() => pick(opt)}
              disabled={wrong !== null}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
