# Graph Report - Battle-cursor  (2026-06-22)

## Corpus Check
- 395 files · ~303,602 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 849 nodes · 1312 edges · 89 communities (62 shown, 27 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 247 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f529dfc7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 86|Community 86]]

## God Nodes (most connected - your core abstractions)
1. `GameConsumer` - 35 edges
2. `GameConsumer` - 34 edges
3. `GameConsumer` - 31 edges
4. `User` - 29 edges
5. `Purchase` - 20 edges
6. `EmailVerification` - 20 edges
7. `Score` - 19 edges
8. `Battle-cursor — CLAUDE.md` - 18 edges
9. `UserProfileSerializer` - 17 edges
10. `UserService` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GameConsumer` --uses--> `ServerService`  [INFERRED]
  consumers.py → services.py
- `Server` --uses--> `Meta`  [INFERRED]
  models.py → serializers.py
- `GameAdmin` --uses--> `Game`  [INFERRED]
  admin.py → models.py
- `GameAdmin` --uses--> `Round`  [INFERRED]
  admin.py → models.py
- `GameAdmin` --uses--> `Score`  [INFERRED]
  admin.py → models.py

## Import Cycles
- 1-file cycle: `celery.py -> celery.py`

## Communities (89 total, 27 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (19): ServerAdmin, APIView, Server, StatusChoices, ServerRepository, Meta, ServerCreateSerializer, ServerDetailSerializer (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (6): AsyncWebsocketConsumer, GameConsumer, Игрок сдаёт рисунок по окончании раунда.         Ожидает: {"type": "round_end",, Игрок применяет дебафф к цели. Одноразовое применение без монет.         Ожидает, Проверяет что активный курсор игрока имеет данный дебафф., Возвращает список защит канваса целевого игрока.

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (29): InventoryAdmin, PurchaseAdmin, APIView, Inventory, Inventory, ItemType, Meta, Purchase (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (44): AbstractUser, CanvasAdmin, CursorAdmin, CustomUserAdmin, EmailVerificationAdmin, APIView, BaseCommand, BaseTokenObtainPairView (+36 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (3): AsyncWebsocketConsumer, GameConsumer, Игрок сдаёт рисунок.         Ожидает: {"type": "round_end", "round_id": "...", "

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (29): GameAdmin, RoundAdmin, ScoreAdmin, APIView, Game, Meta, Round, Score (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (28): APIView, BaseTokenObtainPairView, ServerCreateView, ServerDetailView, ServerJoinView, ServerLeaveView, User, EmailService (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.50
Nodes (3): BaseMiddleware, get_user_from_token(), JWTAuthMiddleware

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (43): `ai`, Backend, Battle-cursor — CLAUDE.md, Context Navigation (Graphify + Obsidian), Context Navigation (Graphify + Obsidian), Frontend, `game`, graphify (+35 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (20): generate_prompts(), grade_drawing(), _groq_text_request(), Генерирует уникальные промпты для раундов через Groq.     При ошибке возвращает, Базовый текстовый запрос к Groq без изображения., Отправляет рисунок в Groq и возвращает оценку и комментарий.      Returns:, _cleanup_round(), _collect_drawings() (+12 more)

### Community 28 - "Community 28"
Cohesion: 0.21
Nodes (7): App(), Footer(), Header(), Home(), NotFound(), steps, Tutorial()

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (4): AppConfig, MarketConfig, clear_market_cache(), При изменении или удалении Курсоров/Холстов из приложения users,     этот сигнал

### Community 63 - "Community 63"
Cohesion: 0.06
Nodes (30): dependencies, axios, @hookform/resolvers, react-hook-form, react-redux, react-router-dom, @reduxjs/toolkit, zod (+22 more)

### Community 64 - "Community 64"
Cohesion: 0.11
Nodes (22): generate_prompts(), grade_drawing(), _groq_text_request(), Генерирует уникальные промпты для раундов через Groq.     При ошибке возвращает, Базовый текстовый запрос к Groq без изображения., Отправляет рисунок в Groq и возвращает оценку и комментарий.      Returns:, _cleanup_round(), _collect_drawings() (+14 more)

### Community 65 - "Community 65"
Cohesion: 0.16
Nodes (10): Home(), MobileGuard(), Purchase, Purchases(), marketAPI, AppDispatch, RootState, store (+2 more)

### Community 66 - "Community 66"
Cohesion: 0.12
Nodes (16): Backend, Email, Frontend, Git префиксы, Redis ключи, WebSocket, Авторизация WS, Архитектурные решения — Battle-cursor (+8 more)

### Community 67 - "Community 67"
Cohesion: 0.15
Nodes (12): Header(), FEATURES, Main(), RARITY_COLOR, Server, api, authAPI, failedQueue (+4 more)

### Community 68 - "Community 68"
Cohesion: 0.13
Nodes (8): Inventory(), Tab, Profile(), RARITY_COLOR, ProfileDetail(), RARITY_COLOR, Inventory, UserProfile

### Community 69 - "Community 69"
Cohesion: 0.21
Nodes (9): DEBUFF_MAP, DEBUFF_RARITY_COLOR, DebuffInfo, Props, PurchaseModal(), Props, RARITY_COLOR, RARITY_LABEL (+1 more)

### Community 70 - "Community 70"
Cohesion: 0.18
Nodes (9): CURSORS, FEATURES, FormData, Login(), schema, useResendCooldown(), authSlice, AuthState (+1 more)

### Community 71 - "Community 71"
Cohesion: 0.17
Nodes (11): api.tsx, Header, Inventory, Pending, Profile, ProfileSettings, ShopItemDetail, Изменённые файлы (+3 more)

### Community 72 - "Community 72"
Cohesion: 0.18
Nodes (10): Backend (pytest), Frontend (Playwright), Postman + Newman + Allure, Postman — подготовка данных, Запуск, Пирамида, Связанные заметки, Структура (+2 more)

### Community 73 - "Community 73"
Cohesion: 0.31
Nodes (8): RARITY_COLOR, Shop(), Tab, initialState, marketSlice, MarketState, Canvas, Cursor

### Community 74 - "Community 74"
Cohesion: 0.20
Nodes (9): 2026-06-22 — Frontend static & Cloudinary, Cloudinary upload, Django → React SPA, JWT access token, Pending, Исправление путей к изображениям, Решения, Связанные заметки (+1 more)

### Community 75 - "Community 75"
Cohesion: 0.22
Nodes (8): metadata.json, Redis, WS событие применения, Валидация при применении, Дебаффы, Защита (Canvas), Механика, Связанные заметки

### Community 76 - "Community 76"
Cohesion: 0.29
Nodes (6): main(), Upload frontend/public images to Cloudinary and generate mapping JSON. Run from, upload(), URL configuration for config project.  The `urlpatterns` list routes URLs to vie, serve_frontend(), Path

### Community 77 - "Community 77"
Cohesion: 0.25
Nodes (7): Canvas, Cursor, EmailVerification, Redis кэш (users), User (AbstractUser), Модели: Users, Связанные заметки

### Community 78 - "Community 78"
Cohesion: 0.25
Nodes (7): generate_prompts — генерация заданий, grade_drawing — оценка рисунка, Groq AI — Оценка и генерация промптов, _groq_text_request — базовый запрос, Интеграция с игровым циклом, Модель, Связанные заметки

### Community 79 - "Community 79"
Cohesion: 0.29
Nodes (6): CURSORS, FEATURES, FormData, getStrength(), Register(), schema

### Community 80 - "Community 80"
Cohesion: 0.29
Nodes (6): Game, Redis (игровое состояние), Round, Score, Модели: Game, Связанные заметки

### Community 81 - "Community 81"
Cohesion: 0.29
Nodes (6): Inventory, Purchase, Redis кэш (market), REST эндпоинты, Модели: Market, Связанные заметки

### Community 82 - "Community 82"
Cohesion: 0.29
Nodes (6): REST эндпоинты, Server, WebSocket, Модели: Server, Онлайн статус, Связанные заметки

### Community 83 - "Community 83"
Cohesion: 0.29
Nodes (6): Redis кэш, Курсоры и Канвасы, Магазин (Market), Механика, Связанные заметки, Эндпоинты

### Community 84 - "Community 84"
Cohesion: 0.33
Nodes (5): Celery задачи (`ai/tasks.py`), Игровой цикл, Очки и монеты, Связанные заметки, Схема

## Knowledge Gaps
- **196 isolated node(s):** `Описание проекта`, `Backend`, `Frontend`, `Тестирование`, `Структура проекта` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ServerService` connect `Community 0` to `Community 1`, `Community 6`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `GameConsumer` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `User` (e.g. with `CanvasAdmin` and `CursorAdmin`) actually correct?**
  _`User` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `Purchase` (e.g. with `InventoryAdmin` and `PurchaseAdmin`) actually correct?**
  _`Purchase` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Описание проекта`, `Backend`, `Frontend` to the rest of the system?**
  _257 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07678075855689177 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07823613086770982 - nodes in this community are weakly interconnected._