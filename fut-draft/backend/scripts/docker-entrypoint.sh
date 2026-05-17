#!/bin/sh
set -e

if [ "${SKIP_PRISMA_MIGRATE:-false}" != "true" ]; then
  npm run prisma:migrate:deploy
fi

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  node dist/prisma/seed.js
fi

exec node dist/src/main.js
