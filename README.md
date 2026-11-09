## Запуск

Требуются Node.js, pnpm и Docker.

Создайте `.env`:

```env
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=coveted_offer
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me-123
POSTGRES_STATEMENT_TIMEOUT_MS=5000
JWT_ACCESS_SECRET=replace-with-at-least-32-characters
JWT_REFRESH_SECRET=replace-with-a-different-secret-of-32-characters
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000
```

```bash
pnpm install
docker compose up -d
pnpm migration:up
pnpm start:dev
```

Миграции создают таблицы на пустой базе. Приложение доступно на `http://localhost:3000`.

Swagger UI доступен на `http://localhost:3000/docs`.

## E2E-тесты

E2E-тесты используют отдельный PostgreSQL на порту `5433`. Основная база из
`.env` не используется.

```bash
pnpm test:e2e:db:up
pnpm test:e2e
pnpm test:e2e:db:down
```

Первая команда запускает тестовую базу, вторая применяет миграции и запускает
тесты, третья останавливает контейнер. Данные тестовой базы хранятся во временной
файловой системе контейнера.
