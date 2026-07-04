# Система дебаффов

## Общая архитектура

```
Игрок нажимает Space / Enter
  → handleApplyDebuff()
  → проверки (debounce 500ms, WS ready, target, used, active)
  → sendWS({type: "debuff_apply", debuff_id, target_id})
  → backend handle_debuff_apply()
  → group_send(debuff_received, target_id)
  → фронт target: applyEffect(debuff_id, duration)
  → activeEffects.add(debuff_id)
  → DebuffOverlay рендерит компонент
```

## Файлы

| Файл | Роль |
|------|------|
| `backend/game/debuffs.py` | DEBUFFS список с id, duration, rarity |
| `backend/servers/consumers.py` | handle_debuff_apply, Redis логика |
| `frontend/src/constants/debuffs.ts` | DEBUFF_MAP, DEBUFF_RARITY_COLOR |
| `frontend/src/components/debuffs/DebuffOverlay.tsx` | роутер эффектов |
| `frontend/src/components/debuffs/effects/` | 40+ компонентов |
| `frontend/src/pages/Game/Game.tsx` | null-эффекты, state management |

## DebuffOverlay

Компонент принимает `activeEffects: Set<string>` и рендерит соответствующий компонент:

```tsx
interface DebuffOverlayProps {
  activeEffects: Set<string>;
  onEffectComplete: (id: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}
```

- **Самозавершающиеся** — получают `onComplete` callback, вызывают после решения/истечения
- **Длительные** — живут пока в `activeEffects`, убираются по таймеру в Game.tsx
- **canvas-зависимые** — получают `canvasRef` для прямого доступа к холсту

## Null-эффекты (в Game.tsx через useEffect/state)

Нет отдельного компонента, реализованы прямо в Game.tsx:

| id | Механизм |
|----|----------|
| `chill` | lerp factor 0.15 в mouse handlers |
| `weight` / `weighting` | lerp с smoothPosRef, factor 0.1 (LEGENDARY) |
| `quickly` | delta × 1.5 от lastDrawPosRef |
| `palette` | setColor(random) немедленно + useEffect каждые 2s |
| `disco` | useEffect: backgroundColor 8 цветов каждые 500ms |
| `transparency` | useEffect: opacity 0.3–1.0 каждые 800ms |
| `brightness` | onCanvasMouseMove: document.body.style.filter = brightness(1 - relY) |
| `blur` | CSS filter на canvas-wrapper |
| `fog` | CSS overlay |

## Все 56 дебаффов

### COMMON (16)
| id | Название | Длительность | Описание |
|----|----------|-------------|---------|
| `chill` | Chill | 5s | Замедляет курсор на 20% |
| `blur` | Blur | 5s | Размывает интерфейс холста |
| `fog` | Fog | 5s | Туман на весь экран |
| `tar` | Tar | 5s | Тёмный туман по холсту |
| `smudge` | Smudge | 5s | Чернильная клякса в центре |
| `weight` | Weight | 5s | Инерция курсора |
| `static` | Static | 5s | Серые полосы по экрану |
| `carousel` | Carousel | 5s | Холст медленно вращается |
| `flash` | Flash | — | Белая вспышка (самозавершающийся) |
| `eraser` | Eraser | 5s | Маленький неубираемый ластик |
| `anonim` | Anonim | 5s | Все игроки выглядят одинаково |
| `mirror` | Mirror | пассивный | Отражает входящий дебафф обратно |
| `advertising` | Advertising | 5s | Всплывающая реклама |
| `palette` | Palette | 5s | Случайная смена цвета каждые 2s |
| `captcha` | Captcha | — | Решить капчу (самозавершающийся) |
| `darkness` | Darkness | 5s | Темнота на холсте |

### RARE (10)
| id | Название | Длительность | Описание |
|----|----------|-------------|---------|
| `collapse` | Collapse | 5s | Элементы интерфейса падают |
| `vandal` | Vandal | 5s | Стекло трескается |
| `shake` | Shake | 5s | Экран дрожит |
| `zoom` | Zoom | 5s | Резкое увеличение x2 за курсором |
| `quickly` | Quickly | 5s | Скорость курсора +50% |
| `popup` | Popup | — | Фейк-окно (самозавершающийся) |
| `timer` | Timer | 5s | Таймер ускоряется (визуально) |
| `palette_swap` | Palette Swap | 5s | Цвета палитры меняются |
| `blocking` | Blocking | — | Фейк ошибка (самозавершающийся) |
| `freeze` | Freeze | 5s | Курсор замирает |

### EPIC (10)
| id | Название | Описание |
|----|----------|---------|
| `riddle` | Riddle | Загадка с текстовым вводом |
| `puzzle` | Puzzle | Пазл-головоломка поверх рисунка |
| `quiz` | Quiz | Вопрос с вариантами ответа |
| `code` | Code | Ввести отображаемый код |
| `maze` | Maze | Провести курсор через лабиринт |
| `agreement` | Agreement | Прочитать и принять соглашение |
| `survey` | Survey | Опрос из одного вопроса |
| `password` | Password | Ввести пароль (показывается на 1 сек) |
| `scan` | Scan | Прогресс-бар фейковой проверки |
| `verify` | Verify | Кликнуть на правильные элементы капчи |

### MYTHIC (10) — аудио эффекты
| id | Звук |
|----|------|
| `siren` | Громкая сирена |
| `hiss` | Шум помех |
| `echo` | Эхо звуков |
| `pyhindu` | Капча Индуса |
| `ringtone` | Мелодия звонка |
| `whisper` | Нарастающий шёпот |
| `glitch` | Искажённые звуки |
| `storm` | Гроза |
| `zombie` | Звуки зомби |
| `bombs` | Взрывы |

Реализованы через `MythicVideoEffect` (video.play() + position: absolute inset: 0).

### LEGENDARY (10) — блокировка цели 5 сек (not duration)
| id | Название | Описание |
|----|----------|---------|
| `questions` | Questions | Угловые попапы с вопросами, растут если не отвечать |
| `exam` | Exam | 5 вопросов, холст уменьшается при правильном, растёт при неправильном |
| `weighting` | Weighting | Очень тяжёлый курсор (lerp 0.1) |
| `weapons` | Weapons | Слот-машина инструментов, "Очистить всё" стирает холст |
| `rickroll` | Rickroll | Видео в случайных местах |
| `disco` | Disco | Холст меняет backgroundColor (8 цветов, 500ms) |
| `transparency` | Transparency | Прозрачность 0.3–1.0 каждые 800ms |
| `brightness` | Brightness | Яркость зависит от Y-позиции курсора |
| `roulette` | Roulette | Крутить рулетку до 33% выигрыша |
| `dvd` | Dvd | Холст движется (RAF, отскакивает от границ) |

## Mirror — пассивный дебафф

Не активируется как обычный эффект. Работает на уровне бэкенда:
1. `handle_debuff_apply` вызывает `target_has_debuff(target_id, "mirror")`
2. Если у цели mirror в курсоре → `group_send(debuff_received, target=sender)` + `send(debuff_reflected)` атакующему
3. Флаг `is_reflected=True` предотвращает рекурсию

## Применение дебаффа — защиты

1. **used_debuff** — каждый дебафф одноразовый за раунд (TTL=70s)
2. **debuff_active** — у цели блокировка на duration (LEGENDARY: 5s)
3. **mirror** — пассивная защита курсора, отражает обратно
4. **canvas protection** — первый раз за раунд блокирует дебафф (TTL=70s per debuff type)

## Очистка при новом раунде

В `start_round` перед push `round_started`:
```python
cache.delete(f"game:{game_id}:debuff_active:{player.id}")
cache.delete_many(cache.iter_keys(f"game:{game_id}:used_debuff:*"))
```

На фронте в обработчике `round_started`:
```ts
setActiveEffects(new Set())
```
