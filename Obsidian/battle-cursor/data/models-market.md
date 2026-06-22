---
tags: [model]
---

# Модели: Market

## Inventory
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| user | FK → User | владелец |
| cursor | FK → Cursor | null если не курсор |
| canvas | FK → Canvas | null если не канвас |
| acquired_at | datetime | дата получения |

Каждый пользователь начинает с базовым курсором и канвасом (через management command `init_game_data`).

---

## Purchase
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| user | FK → User | покупатель |
| cursor | FK → Cursor | null если не курсор |
| canvas | FK → Canvas | null если не канвас |
| price | int | цена на момент покупки |
| purchased_at | datetime | |

---

## REST эндпоинты
| Метод | URL | Действие |
|---|---|---|
| GET | `/api/market/` | список магазина (кэш) |
| POST | `/api/market/buy/` | купить предмет |
| GET | `/api/market/inventory/` | инвентарь (кэш) |
| GET | `/api/market/purchases/` | история покупок (кэш) |

---

## Redis кэш (market)
- Список магазина: кэшируется в `MarketService`
- Инвалидация: сигнал `clear_market_cache` при изменении Cursor/Canvas

---

## Связанные заметки
- [[data/models-users]] — User, Cursor, Canvas
- [[features/market]] — описание механики магазина
