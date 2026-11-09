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
