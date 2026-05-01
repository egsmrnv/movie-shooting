# Movie Shooting Schedule

MSS is a multi-tenant scheduling service for film crews, production teams, and studios.

The product model is service-first: any administrator can sign in, create a studio, choose its public username, and invite employees to request access by that username. Each studio has isolated users, projects, vehicles, shifts, assignments, and call sheet PDFs.

Stack: Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth/Yandex OAuth, Docker Compose, and local PDF storage.

## Product Flow

- An unauthenticated visitor chooses one of two paths: employee or administrator.
- Employee path: sign in, enter the studio username, and send an access request.
- Administrator path: sign in, create a studio with title and username, and become the OWNER of that studio.
- OWNER and ADMIN users can approve or block employee requests and edit display names inside the studio.
- Only the studio OWNER can change access levels and grant ADMIN rights.
- A regular USER sees only their own shifts inside approved studios.
- All studio data is scoped per studio.

## Quick Start

```bash
cp .env.example .env
npm install
docker compose up -d db
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Fill these values in `.env` before real sign-in:

- `NEXTAUTH_SECRET`
- `YANDEX_CLIENT_ID`
- `YANDEX_CLIENT_SECRET`

Yandex OAuth callback URL for local development:

```text
http://localhost:3000/api/auth/callback/yandex
```

## Environment

Copy the example:

```bash
cp .env.example .env
```

Do not commit `.env`.

For production compose also set:

```env
POSTGRES_PASSWORD="replace-with-strong-password"
APP_DOMAIN="your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
```

Production Yandex OAuth callback URL:

```text
https://your-domain.com/api/auth/callback/yandex
```

## Local Development

PostgreSQL in Docker, app on the host:

```bash
docker compose up -d db
npm install
npx prisma migrate dev
npm run dev
```

Full Docker setup:

```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

## Production With Docker

```bash
git clone https://github.com/egsmrnv/movie-shooting.git
cd movie-shooting
cp .env.example .env
nano .env
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

Caddy serves the app over HTTPS for `APP_DOMAIN`.

Uploaded PDFs are stored in the `uploads` Docker volume at `/app/uploads` inside the app container.

Useful production commands:

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml exec db pg_dump -U user movie_shooting > backup.sql
docker run --rm -v movie-shooting_uploads:/data -v "$PWD":/backup alpine tar czf /backup/uploads-backup.tgz -C /data .
```

Update:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

## Production Without Docker

Fallback path:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start npm --name movie-shooting-schedule -- run start
```

Run the app behind Nginx or another reverse proxy on `127.0.0.1:3000` and configure HTTPS.

## Useful Scripts

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

## Security Notes

- `.env` and `uploads` are excluded from git.
- Server actions and API routes check studio membership on every protected operation.
- PENDING and BLOCKED users cannot access private studio data.
- ADMIN and OWNER users operate only inside the current studio.
- Only OWNER can change user access levels.
