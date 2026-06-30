---
date: 2026-06-30
tags: [session-log, frontend, backend, debuffs, legendary, game]
---

# Сессия: LEGENDARY дебаффы + WeightEffect, MirrorEffect, PaletteEffect, QuicklyEffect

## Что сделано

### Frontend — LEGENDARY дебаффы (9 новых компонентов)

**[[QuestionsEffect.tsx]]**
- 1–3 угловых попапа (`position: fixed`, правый край, стакаются снизу вверх)
- Каждые 5с добавляется новое окно (max 3), анимация slide-in
- Правильный ответ закрывает окно, все закрыты → `onComplete`

**[[ExamEffect.tsx]]**
- Блокирующий оверлей, 5 вопросов
- Правильно → canvas shrinks 10% (`canvasRef.current.style.transform = scale(...)`)
- Неправильно → canvas grows 10%, max 180%, min 40%
- Flash-анимация border (зелёный/красный), cleanup при unmount

**[[WeaponsEffect.tsx]]**
- Слот-машина 2с, 5 инструментов
- "Очистить всё" → реально очищает `canvasRef` через `ctx.fillRect`
- После выбора → 1.5с показывает результат → `onComplete`

**[[RouletteEffect.tsx]]**
- 33% шанс "Доступ открыт!" за попытку
- Крутится 2с анимация, показывает результат
- При выигрыше → `onComplete` через 800мс, иначе снова кнопка "Крутить"

**[[DvdEffect.tsx]]**
- RAF-анимация: `canvas-wrapper.style.transform = translate(x, y)`
- Скорость vx=2, vy=1.4, отскакивает от ±90px / ±60px
- `duration=null`, живёт до конца раунда, cleanup: reset transform

**[[MythicVideoEffect.tsx]]** + 10 компонентов (siren, hiss, echo, pyhindu, ringtone, whisper, glitch, storm, zombie, bombs)
- Общий компонент с `video.play().catch(() => onComplete())` fallback
- `position: absolute; inset: 0` — перекрывает холст
- Label убран после тестирования (был лишним)

### Frontend — null-компоненты в [[Game.tsx]]

**Disco**
- `useEffect` на `hasDisco`: hue-rotate +30° каждые 500мс
- Cleanup: `canvasRef.current.style.filter = ""`

**Transparency**
- `useEffect` на `hasTransparency`: opacity 0.3–1.0 каждые 800мс
- Cleanup: opacity = "1"

**Brightness**
- В `onCanvasMouseMove`: `document.body.style.filter = brightness(1 - relY)`
- Отдельный `useEffect` на `hasBrightness` для cleanup

**Weighting (LEGENDARY)**
- `smoothPosRef` с lerp 0.1 (очень тяжёлый курсор)

**LEGENDARY перезарядка**
- `LEGENDARY_DEBUFFS` set у константы
- После `ws.send` → `setUsedDebuffs` + setTimeout 5000ms → удаляет из usedDebuffs

### Frontend — 4 новых дебаффа

**WeightEffect (COMMON)**
- Добавлен `smoothPosRef = useRef({ x: 0, y: 0 })`
- `onCanvasMouseMove` + `onMouseDown`: lerp к raw pos с factor 0.15
- `weighting` использует тот же `smoothPosRef`, factor 0.1

**QuicklyEffect (RARE)**
- Delta × 1.5 от `lastDrawPosRef`
- В `onCanvasMouseMove` и `onMouseDown`

**PaletteEffect (COMMON)**
- При `debuff_received`: немедленно `setColor(PALETTE[random])`
- Теперь вызывает `applyEffect(debuff_id, duration)` → добавляет в `activeEffects`
- `useEffect` на `hasPalette`: меняет цвет каждые 2000мс
- Cleanup: `clearInterval`

**MirrorEffect (COMMON) — backend + frontend**
- Убран старый неправильный frontend WS-send (`mirror_reflected`)
- Backend `target_has_debuff(target_id, "mirror")` — новый `@database_sync_to_async` хелпер
- В `handle_debuff_apply`: если target имеет mirror в курсоре → `group_send(debuff_received, target=sender)` + `send(debuff_reflected)`
- Frontend: новый `case "debuff_reflected"` → уведомление `🪞 Дебафф отражён!`

### Frontend — CSS (DebuffOverlay.css)

Новые классы:
- `.effect-questions-window` — fixed popups с slide-in анимацией
- `.effect-questions-opt` / `--wrong`
- `.effect-exam-scale-hint`, `.effect-exam-flash--correct/wrong`
- `.effect-weapons-slot`, `.effect-weapons-item--active`, `.effect-weapons-result`
- `.effect-roulette-wheel`, `.effect-roulette-spinning`, `.effect-roulette-result--win`

### Frontend — kick redirect

- `player_left` handler: при `user_id === me && kicked` → `navigate("/main", { state: { error: "..." } })`
- `Main.tsx`: читает `location.state?.error`, показывает `.main-error-notification`
- Клик по нотификации закрывает её

### Frontend — zoom дебафф

- Scale увеличен до 2.0 (было 1.3)

## Решения

- **smoothPosRef vs lastDrawPosRef**: smoothPosRef обновляется на каждый mousemove (true инертность), lastDrawPosRef остаётся для `chill`/`quickly` delta-расчётов
- **Mirror без рекурсии**: бэкенд отражает через `group_send(debuff_received)` напрямую — не проходит через `handle_debuff_apply` повторно
- **Palette в activeEffects**: теперь palette тоже вызывает `applyEffect` → попадает в `activeEffects` → useEffect для периодической смены цвета работает

## Pending

- Тест полного игрового цикла
- Проверить `game_state_sync` в реальных условиях
- Загрузить оставшиеся видео в `/sounds/` (zombie, glitch, ringtone, bombs, echo, hiss, whisper...)
