---
tags: [feature]
---

# Дебаффы

## Механика

- **60+ дебаффов** в `game/debuffs.py`
- **5 уровней редкости**: COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
- Применение **одноразовое**, монеты не тратятся
- Нельзя применить дебафф если у цели уже активен **другой** дебафф
- Дебаффы привязаны к **курсорам** — курсор определяет какие дебаффы можно применять

## WS событие применения
```json
// Клиент → Сервер
{"type": "debuff_apply", "debuff_id": "blur", "target_id": "uuid"}

// Сервер → все в комнате
{"type": "debuff_received", "debuff_id": "blur", "duration": 5, "from_user_id": "uuid", "target_id": "uuid"}
```

## Redis
- Активный дебафф: `game:{id}:debuff_active:{user_id}` = debuff_id, TTL = duration сек
- После истечения TTL дебафф автоматически снимается

## Защита (Canvas)
- Канвас содержит список `protections` (debuff_id)
- Если дебафф входит в `protections` цели → иммунитет: `duration // 2`

## Валидация при применении
1. Проверить что активный курсор **атакующего** имеет данный debuff_id
2. Проверить что у цели нет активного дебаффа (`game:{id}:debuff_active:{target_id}`)
3. Применить или выдать `error`

## metadata.json
`game/metadata.json` — справочник курсоров и канвасов с привязанными дебаффами/защитами. Используется при инициализации данных (`init_game_data`).

---

## Связанные заметки
- [[data/models-users]] — Cursor (debuffs), Canvas (protections)
- [[features/game-cycle]] — когда применяются дебаффы
- [[data/models-server]] — GameConsumer обрабатывает debuff_apply
