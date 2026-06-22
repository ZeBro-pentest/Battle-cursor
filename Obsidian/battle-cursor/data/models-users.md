---
tags: [model]
---

# Модели: Users

## User (AbstractUser)
Расширяет стандартный Django User.

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| username | str | ник |
| email | str | уникальный |
| coins | int | игровая валюта |
| rating | int | +1 за победу (1 место) |
| active_cursor | FK → Cursor | текущий курсор |
| active_canvas | FK → Canvas | текущий канвас |
| is_email_verified | bool | верификация email |

---

## Cursor
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| name | str | название |
| rarity | choices | COMMON/UNCOMMON/RARE/EPIC/LEGENDARY |
| price | int | цена в монетах |
| image_url | URLField | Cloudinary URL |
| debuffs | JSON | список debuff_id которые даёт курсор |

---

## Canvas
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| name | str | название |
| rarity | choices | COMMON→LEGENDARY |
| price | int | цена в монетах |
| image_url | URLField | Cloudinary URL |
| protections | JSON | список debuff_id от которых защищает |

Иммунитет при защите: `debuff.duration // 2`

---

## EmailVerification
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| user | FK → User | |
| token | str | уникальный токен |
| created_at | datetime | |
| expires_at | datetime | |

---

## Redis кэш (users)
- Профили: `user:{id}:profile`
- Инвентарь: `user:{id}:inventory`
- Онлайн статус: `user:{id}:online` TTL=20 сек

---

## Связанные заметки
- [[data/models-market]] — Inventory, Purchase
- [[data/models-server]] — Server (players M2M → User)
- [[features/market]] — покупки курсоров/канвасов
