# FUT Draft Backend

Backend for football draft simulation built with NestJS + Prisma + PostgreSQL.

## Features in this version

- Create users
- Draft session with selectable formation (5 predefined formations)
- 18 picks per session
- Exactly 2 goalkeepers per session (not less, not more)
- 5 player options per slot
- Tournament simulation with 8 teams (quarterfinal, semifinal, final)
- Tournament bracket persistence in database

## Core API

- `GET /api/health`
- `POST /api/users`
- `GET /api/users`
- `GET /api/draft/formations`
- `POST /api/draft/sessions`
- `GET /api/draft/sessions/:sessionId`
- `GET /api/draft/sessions/:sessionId/options`
- `GET /api/draft/sessions/:sessionId/picks`
- `POST /api/draft/sessions/:sessionId/pick`
- `POST /api/draft/sessions/:sessionId/tournament/start`
- `GET /api/draft/sessions/:sessionId/tournament`

## First start

1. Install dependencies

```bash
cd backend
npm install
```

2. Create `.env` from `.env.example`

3. Apply migration and generate Prisma client

```bash
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
```

4. Seed catalog data

```bash
npm run seed
```

5. Start backend

```bash
npm run start:dev
```

## If you already migrated old schema before

Use a reset once to rebuild local DB schema cleanly:

```bash
npx prisma migrate reset
npm run seed
```

## Quick test flow

1. Create user or use seeded `demo_user`
2. Get formations and create draft session
3. Repeat pick flow until 18 players are selected
4. Start tournament simulation
5. Read full bracket from tournament endpoint
