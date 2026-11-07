## Запуск проекта

### Требования

- Node.js
- pnpm
- Docker

### Установка зависимостей

```bash
pnpm install
```

Запустить PostgreSQL
```bash
docker compose up -d
```

Миграция:
```bash
pnpm migration:up
```

Старт приложения 
```bash
pnpm start:dev
```