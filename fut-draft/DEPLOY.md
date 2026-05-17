# Deploy

Production deploy is prepared for one application container plus an external PostgreSQL database.
The container serves:

- frontend SPA from `/`
- backend API from `/api`
- player images from `/player-images`
- Prometheus metrics from `/api/metrics`

## Dokploy variables

Set these environment variables in Dokploy:

```env
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
JWT_ACCESS_SECRET=replace-with-long-random-string
JWT_REFRESH_SECRET=replace-with-another-long-random-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_ORIGIN=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
FRONTEND_DIST_PATH=/app/public/app
PLAYER_IMAGE_CACHE_DIR=/app/public/player-images
AI_MATCH_SIMULATION_ENABLED=true
AI_MATCH_SIMULATION_ENDPOINT=https://openrouter.ai/api/v1/chat/completions
AI_MATCH_SIMULATION_MODEL=deepseek/deepseek-v4-flash:free
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_HTTP_REFERER=https://your-domain.com
OPENROUTER_APP_TITLE=Fut Draft
AI_MATCH_SIMULATION_TIMEOUT_MS=15000
THESPORTSDB_API_KEY=123
RUN_DB_SEED=false
```

For the first deploy on an empty database, set `RUN_DB_SEED=true` once. After the seed succeeds, set it back to `false` and redeploy/restart.

## Dokploy volume

Add a persistent volume if you want player images to survive rebuilds:

```text
/app/public/player-images
```

## Build

Dokploy should use the root `Dockerfile`. Expose container port `3001`.

The container runs migrations automatically before starting the app:

```sh
npm run prisma:migrate:deploy
node dist/main.js
```

Health check URL:

```text
/api/health
```
