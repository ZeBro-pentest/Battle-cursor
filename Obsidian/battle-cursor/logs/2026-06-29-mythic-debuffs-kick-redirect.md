---
date: 2026-06-29
tags: [session-log, frontend, debuffs, mythic, game]
---

# Сессия: MYTHIC дебаффы + кик-редирект

## Что сделано

### Frontend — [[Game.tsx]]

**Кик текущего игрока**
- В `player_left` handler добавлена проверка `user_id === profileRef.current?.id && kicked`
- При совпадении: `navigate("/main", { state: { error: "Вы были исключены из игры за отсутствие." } })` + ранний return
- Остальные игроки по-прежнему помечаются `online: false` и показывается уведомление

### Frontend — [[Main.tsx]]

**Отображение ошибки кика**
- Добавлен `useLocation` из `react-router-dom`
- State `errorMsg` инициализируется из `location.state?.error ?? null`
- JSX: `<div className="main-error-notification" onClick={() => setErrorMsg(null)}>` — клик закрывает

### Frontend — [[Main.css]]

- Добавлен `.main-error-notification`: `position: fixed`, `top: 80px`, `left: 50%`, акцент-бордер, красное свечение `box-shadow`, `cursor: pointer`

### Frontend — MYTHIC видео дебаффы

**[[MythicVideoEffect.tsx]]** (новый общий компонент)
- `video.play().catch(() => onComplete())` — fallback если файл не найден
- Label поверх видео (`position: absolute`, `top: 12px`)
- `muted={false}` — видео со звуком

**10 новых компонентов** (каждый — враппер над `MythicVideoEffect`):
- `SirenEffect` → `/sounds/siren.mp4` · "🚨 СИРЕНА"
- `HissEffect` → `/sounds/hiss.mp4` · "📡 ПОМЕХИ"
- `EchoEffect` → `/sounds/echo.mp4` · "🔊 ЭХО"
- `PyhinduEffect` → `/sounds/pyhindu.mp4` · "🎵 ПХИНДУ"
- `RingtoneEffect` → `/sounds/ringtone.mp4` · "📱 ЗВОНОК"
- `WhisperEffect` → `/sounds/whisper.mp4` · "👻 ШЁПОТ"
- `GlitchEffect` → `/sounds/glitch.mp4` · "⚡ ГЛИТЧ"
- `StormEffect` → `/sounds/storm.mp4` · "⛈️ ГРОЗА"
- `ZombieEffect` → `/sounds/zombie.mp4` · "🧟 ЗОМБИ"
- `BombsEffect` → `/sounds/bombs.mp4` · "💣 ВЗРЫВЫ"

**[[DebuffOverlay.css]]**
- Добавлены `.effect-mythic-video`, `.effect-mythic-video-player`, `.effect-mythic-label`
- `z-index: 15` для оверлея, `z-index: 16` для лейбла

**[[DebuffOverlay.tsx]]**
- 10 новых импортов
- 10 новых JSX-блоков `{activeEffects.has("...") && <...Effect onComplete={...} />}`

## Решения

- **Fallback при отсутствии видео**: `video.play().catch(() => onComplete())` гарантирует что эффект завершается даже если файл не загружен
- **Кик без флага**: если `kicked` не передан бэкендом, логика не меняется — игрок просто уходит в offline

## Pending

- Добавить видео файлы в `/sounds/` (siren, hiss, echo, pyhindu, ringtone, whisper, glitch, storm, zombie, bombs)
- Тест полного игрового цикла
- Проверить `game_state_sync` в реальных условиях
