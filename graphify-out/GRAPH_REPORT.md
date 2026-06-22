# Graph Report - .  (2026-06-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 440 nodes · 751 edges · 63 communities (37 shown, 26 thin omitted)
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 226 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1d71a2fc`
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

## God Nodes (most connected - your core abstractions)
1. `GameConsumer` - 34 edges
2. `GameConsumer` - 31 edges
3. `User` - 29 edges
4. `Purchase` - 20 edges
5. `EmailVerification` - 20 edges
6. `Score` - 19 edges
7. `UserProfileSerializer` - 17 edges
8. `UserRegisterSerializer` - 16 edges
9. `UserUpdateSerializer` - 16 edges
10. `UserService` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GameConsumer` --uses--> `ServerService`  [INFERRED]
  consumers.py → services.py
- `Server` --uses--> `Meta`  [INFERRED]
  models.py → serializers.py
- `Command` --uses--> `Canvas`  [INFERRED]
  management/commands/init_game_data.py → models.py
- `Command` --uses--> `Cursor`  [INFERRED]
  management/commands/init_game_data.py → models.py
- `GameAdmin` --uses--> `Game`  [INFERRED]
  admin.py → models.py

## Import Cycles
- 1-file cycle: `celery.py -> celery.py`

## Communities (63 total, 26 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (19): ServerAdmin, APIView, Server, StatusChoices, ServerRepository, Meta, ServerCreateSerializer, ServerDetailSerializer (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (6): AsyncWebsocketConsumer, GameConsumer, Игрок сдаёт рисунок по окончании раунда.         Ожидает: {"type": "round_end",, Игрок применяет дебафф к цели. Одноразовое применение без монет.         Ожидает, Проверяет что активный курсор игрока имеет данный дебафф., Возвращает список защит канваса целевого игрока.

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (29): InventoryAdmin, PurchaseAdmin, APIView, Inventory, Inventory, ItemType, Meta, Purchase (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (38): AbstractUser, CanvasAdmin, CursorAdmin, CustomUserAdmin, EmailVerificationAdmin, APIView, BaseTokenObtainPairView, Canvas (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (3): AsyncWebsocketConsumer, GameConsumer, Игрок сдаёт рисунок.         Ожидает: {"type": "round_end", "round_id": "...", "

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (21): GameAdmin, RoundAdmin, ScoreAdmin, APIView, Game, Meta, Round, Score (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.40
Nodes (4): Пароль:     - минимум 8 символов     - минимум одна цифра     - минимум одна бук, Список дебаффов — каждый элемент должен быть валидным id из debuffs.py, validate_debuffs_list(), validate_password_strength()

### Community 8 - "Community 8"
Cohesion: 0.50
Nodes (3): BaseMiddleware, get_user_from_token(), JWTAuthMiddleware

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (20): generate_prompts(), grade_drawing(), _groq_text_request(), Генерирует уникальные промпты для раундов через Groq.     При ошибке возвращает, Базовый текстовый запрос к Groq без изображения., Отправляет рисунок в Groq и возвращает оценку и комментарий.      Returns:, _cleanup_round(), _collect_drawings() (+12 more)

### Community 28 - "Community 28"
Cohesion: 0.21
Nodes (7): App(), Footer(), Header(), Home(), NotFound(), steps, Tutorial()

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (8): Задание для раунда:     - не пустое     - от 3 до 100 символов, Нельзя присоединиться к уже начатой или завершённой игре., Нельзя присоединиться к игре дважды., Нельзя присоединиться если игра заполнена., validate_game_not_full(), validate_game_not_started(), validate_player_not_in_game(), validate_prompt()

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (4): AppConfig, MarketConfig, clear_market_cache(), При изменении или удалении Курсоров/Холстов из приложения users,     этот сигнал

## Knowledge Gaps
- **24 isolated node(s):** `Migration`, `Migration`, `Migration`, `Migration`, `Migration` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameConsumer` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `ServerService` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `User` (e.g. with `CanvasAdmin` and `CursorAdmin`) actually correct?**
  _`User` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `Purchase` (e.g. with `InventoryAdmin` and `PurchaseAdmin`) actually correct?**
  _`Purchase` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `EmailVerification` (e.g. with `CanvasAdmin` and `CursorAdmin`) actually correct?**
  _`EmailVerification` has 15 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Игрок сдаёт рисунок.         Ожидает: {"type": "round_end", "round_id": "...", "`, `Базовый текстовый запрос к Groq без изображения.`, `Отправляет рисунок в Groq и возвращает оценку и комментарий.      Returns:` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07446808510638298 - nodes in this community are weakly interconnected._