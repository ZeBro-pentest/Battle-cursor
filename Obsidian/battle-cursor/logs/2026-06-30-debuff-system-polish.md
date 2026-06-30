---
date: 2026-06-30
tags: [session-log, backend, frontend, debuffs, game]
---

# Сессия: полировка системы дебаффов

## Что сделано

### Backend — [[consumers.py]]

**Самоприменение дебаффа**
- Добавлена проверка `target_id == str(self.user.id)` сразу после получения target_id
- Возврат ошибки "Нельзя применить дебафф на себя."
- Лог `debuff_apply: sender=%s target=%s debuff=%s same_player=%s` до проверки

**LEGENDARY дебаффы — блокировка цели**
- LEGENDARY_DEBUFFS set определён в `handle_debuff_apply`
- Блокировка цели для LEGENDARY: `timeout=5` (через 5 сек цель снова доступна)
- Обычные дебаффы: `timeout=duration` (без изменений)
- Проверка активного дебаффа снова простая: любой активный → блокирует

**Mirror**
- Добавлен `target_has_debuff(target_id, "mirror")` — `@database_sync_to_async` хелпер
- Проверяет cursor.debuffs целевого игрока
- Если mirror → `group_send(debuff_received, target=sender)` + `send(debuff_reflected)`

### Frontend — [[Game.tsx]]

**LEGENDARY дебаффы — activeTargetDebuffs**
- Снимают блокировку через 5 сек (не через duration)
- `LEGENDARY_DEBUFFS` set определён внутри `debuff_received` handler

**LEGENDARY дебаффы — badge на карточке**
- Badge снимается через 5 сек (было: через duration или никогда)
- Проверка `prev[target_id] === debuff_id` перед удалением

**LEGENDARY дебаффы — одноразовые у отправителя**
- Убран `setTimeout` перезарядки 5 сек из `handleApplyDebuff`
- Теперь одноразовые, как и все остальные дебаффы

**activeEffects — проверка target_id**
- Аудит: `applyEffect` вызывается только внутри `if (target_id === profileRef.current?.id)`
- `setActiveEffects` нигде не вызывается без этой проверки — всё корректно

**round_started — сброс эффектов**
- Добавлен `setActiveEffects(new Set())` первым в обработчике
- Все LEGENDARY эффекты жертвы сбрасываются при новом раунде

**DiscoEffect**
- Изменён с `hue-rotate(filter)` на `backgroundColor` с 8 цветами
- Cleanup сбрасывает `backgroundColor = "#ffffff"`

**MirrorEffect — frontend**
- Убран старый неправильный WS-send `mirror_reflected`
- Добавлен `case "debuff_reflected"` → уведомление `🪞 Дебафф отражён!`

**PaletteEffect**
- При `debuff_received`: немедленный `setColor(random)` + `applyEffect` → `activeEffects`
- `useEffect` на `hasPalette`: смена цвета каждые 2с

### Backend — [[ai/tasks.py]]

**start_round — чистка debuff_active**
- Перед пушем `round_started` удаляет `game:{id}:debuff_active:{player_id}` для всех игроков
- Использует `game.server.players.all()`, завёрнуто в `try/except`

### Исследование

**Курсор Absolute** — дебаффы:
`weight, flash, mirror, palette_swap, collapse, code, puzzle, storm, siren, rickroll, disco`
- Нет поля `is_default` в моделях
- Нет логики "применить на себя" в consumers.py
- `mirror` — пассивная защита (отражает входящие дебаффы)

## Решения

- **LEGENDARY блокировка 5 сек**: бэкенд `timeout=5` + фронтенд `setTimeout 5000` — симметрично
- **Mirror без рекурсии**: бэкенд отражает через `group_send(debuff_received)` напрямую, не через `handle_debuff_apply`
- **Disco backgroundColor vs filter**: `hue-rotate` искажал нарисованное, `backgroundColor` не трогает содержимое холста

## Pending

- Тест полного игрового цикла
- Проверить `game_state_sync` в реальных условиях
- Загрузить оставшиеся видео в `/sounds/`
