---
tags: [model]
---

# Модели: Server

## Server
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| room_code | str(6) | уникальный код комнаты |
| host | FK → User | создатель, может стартовать игру |
| players | M2M → User | текущие игроки |
| status | choices | WAITING / IN_PROGRESS / FINISHED |
| max_players | int | 2–8 |
| game | OneToOne → Game | null пока игра не начата |

---

## REST эндпоинты
| Метод | URL | Действие |
|---|---|---|
| POST | `/api/servers/` | создать комнату |
| GET | `/api/servers/` | список комнат |
| GET | `/api/servers/{id}/` | детали |
| POST | `/api/servers/{id}/join/` | присоединиться |
| POST | `/api/servers/{id}/leave/` | покинуть |

Валидации join:
- нельзя присоединиться к начатой/завершённой игре
- нельзя дважды
- нельзя если заполнена

---

## WebSocket
- Consumer: `GameConsumer` (`AsyncWebsocketConsumer`) в `servers/consumers.py`
- URL: `ws://.../ws/servers/{room_code}/`
- Авторизация: `JWTAuthMiddleware` — JWT в query string
- Group name: `room_{room_code}`

`GameConsumer` — бог-узел графа (34 edges), мост между серверной и игровой логикой.

---

## Онлайн статус
Redis key `user:{id}:online` TTL=20 сек — обновляется при ping/активности в WS.

---

## Связанные заметки
- [[data/models-game]] — Game, Round, Score
- [[data/models-users]] — User (host, players)
- [[architecture/decisions]] — WS события и коды закрытия
- [[features/game-cycle]] — game_start через WS
