# 26 FPS Schedule

Production-ready MVP приватного multi-tenant расписания для съёмочных групп и студий.

Стек: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-style компоненты, Prisma, PostgreSQL, NextAuth/Yandex OAuth, Docker Compose, локальное файловое хранилище PDF.

## Быстрый старт

```bash
cp .env.example .env
npm install
docker compose up -d db
npx prisma migrate dev
npm run db:seed
npm run dev
```

После запуска приложение будет доступно на `http://localhost:3000`.

Перед первым входом заполните в `.env` как минимум:

- `NEXTAUTH_SECRET`
- `YANDEX_CLIENT_ID`
- `YANDEX_CLIENT_SECRET`
- `OWNER_EMAIL`
- `DEFAULT_STUDIO_TITLE`

В Yandex OAuth добавьте callback URL:

```text
http://localhost:3000/api/auth/callback/yandex
```

## Возможности MVP

- Вход через Yandex OAuth.
- Один глобальный `User`, много `Studio`.
- Статус и доступ пользователя хранятся в `StudioMember`, отдельно для каждой студии.
- Bootstrap первой студии через `OWNER_EMAIL` и `DEFAULT_STUDIO_TITLE`.
- Создание студии, запрос доступа по slug, pending/blocked экраны.
- OWNER/ADMIN админка студии: пользователи, проекты, проектная команда, машины, мастер-расписание, PDF вызывные.
- USER личный кабинет: только собственные смены внутри текущей студии.
- Read-only виды: “Проект × Даты”, “Сотрудники”, “Камервагены”, календарь проекта.
- PDF хранятся в `UPLOAD_DIR/studios/{studioId}/call-sheets/{shiftId}.pdf` и отдаются только через защищённый route.
- Модель `PushSubscription` и foundation для Web Push.
- Docker production setup для VPS без зависимости от Vercel.

## Environment

Скопируйте пример:

```bash
cp .env.example .env
```

Заполните секреты вручную. Не коммитьте `.env`.

Yandex OAuth callback URLs:

- local: `http://localhost:3000/api/auth/callback/yandex`
- production: `https://your-domain.ru/api/auth/callback/yandex`

Для production compose также добавьте в `.env`:

```env
POSTGRES_PASSWORD="replace-with-strong-password"
APP_DOMAIN="your-domain.ru"
NEXTAUTH_URL="https://your-domain.ru"
```

## Local development without Docker

1. Установите зависимости:

```bash
npm install
```

2. Создайте `.env` из `.env.example`.

3. Запустите локальный PostgreSQL и укажите:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/movie_shooting"
UPLOAD_DIR="./uploads"
```

4. Выполните миграции:

```bash
npx prisma migrate dev
```

5. При желании заполните демо-данные:

```bash
npm run db:seed
```

6. Запустите dev server:

```bash
npm run dev
```

## Local development with Docker

Вариант с Docker только для PostgreSQL:

```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev
npm run dev
```

Полный Docker-вариант:

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

Приложение будет доступно на `http://localhost:3000`.

## Deploy to Beget VPS with Docker

Основной production путь рассчитан на Docker Compose.

1. Создайте Beget VPS.
2. Установите Docker и Docker Compose plugin.
3. Склонируйте репозиторий:

```bash
git clone https://github.com/egsmrnv/movie-shooting.git
cd movie-shooting
```

4. Создайте production env:

```bash
cp .env.example .env
nano .env
```

5. Вручную заполните `NEXTAUTH_SECRET`, `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`, `OWNER_EMAIL`, `POSTGRES_PASSWORD`, `APP_DOMAIN`, `NEXTAUTH_URL`, VAPID ключи при необходимости.

6. В настройках Yandex OAuth добавьте callback:

```text
https://your-domain.ru/api/auth/callback/yandex
```

7. Запустите контейнеры:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

8. Выполните миграции:

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

9. Проверьте логи:

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

10. Настройте DNS домена на IP VPS. Caddy из `docker-compose.prod.yml` автоматически выпустит HTTPS-сертификат для `APP_DOMAIN`.

11. Uploaded PDF лежат в Docker volume `uploads`, внутри контейнера путь `/app/uploads`.

12. Backup PostgreSQL:

```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U user movie_shooting > backup.sql
```

13. Backup uploads volume:

```bash
docker run --rm -v movie-shooting_uploads:/data -v "$PWD":/backup alpine tar czf /backup/uploads-backup.tgz -C /data .
```

14. Обновление приложения:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

15. Перезапуск:

```bash
docker compose -f docker-compose.prod.yml restart
```

PostgreSQL в production compose не публикует порт `5432` наружу. Приложение доступно внутри Docker network на `app:3000`, наружу его отдаёт Caddy.

## Deploy to Beget VPS without Docker

Короткий fallback путь:

1. Установите Node.js LTS, PostgreSQL, PM2, Nginx и Certbot.
2. Создайте PostgreSQL базу и пользователя.
3. Заполните `.env` с production `DATABASE_URL`, `NEXTAUTH_URL`, Yandex OAuth secrets и `UPLOAD_DIR`.
4. Выполните:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start npm --name 26-fps-schedule -- run start
```

5. Настройте Nginx reverse proxy на `127.0.0.1:3000` и HTTPS через Certbot.

Docker остаётся рекомендуемым способом production-запуска.

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:studio
npm run db:seed
```

## Security notes

- `.env` и `uploads` исключены из git.
- Все бизнес-запросы используют `studioId`.
- Server actions и API routes заново проверяют membership текущего пользователя.
- PENDING/BLOCKED пользователи не получают private data студии.
- USER видит только смены, где он назначен.
- ADMIN/OWNER ограничены своей студией.
- PDF доступны только через защищённый route.
