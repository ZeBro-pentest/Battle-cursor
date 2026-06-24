---
tags: [feature]
---

# Магазин (Market)

## Механика

Игроки покупают курсоры и канвасы за монеты, заработанные в игре.

Монеты зарабатываются: `score × 10` по итогам игры (см. [[features/game-cycle]]).

---

## Эндпоинты

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/market/` | список всех курсоров и канвасов с ценами |
| POST | `/api/market/buy/` | купить предмет (списывает монеты) |
| GET | `/api/market/inventory/` | предметы пользователя |
| GET | `/api/market/purchases/` | история покупок |

---

## Курсоры и Канвасы

**Курсоры** (`Cursor`) — определяют какие дебаффы игрок может применять.  
**Канвасы** (`Canvas`) — определяют от каких дебаффов защищён игрок.

5 уровней редкости: COMMON, UNCOMMON, RARE, EPIC, LEGENDARY.

Начальные данные загружаются через management command `init_game_data` из `game/metadata.json`.

---

## Redis кэш

- Список магазина кэшируется в `MarketService`
- Инвалидация: Django сигнал `clear_market_cache` в `market/apps.py` — срабатывает при изменении или удалении объектов `Cursor`/`Canvas` в приложении `users`

---

## Связанные заметки
- [[data/models-market]] — Inventory, Purchase
- [[data/models-users]] — Cursor, Canvas
- [[features/debuffs]] — курсоры дают дебаффы, канвасы дают защиты
- [[features/game-cycle]] — монеты начисляются в game_over
