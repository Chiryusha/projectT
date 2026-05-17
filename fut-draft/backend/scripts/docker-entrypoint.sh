#!/bin/sh
set -e

if [ "${SKIP_PRISMA_MIGRATE:-false}" != "true" ]; then
  npm run prisma:migrate:deploy
fi

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  npm run prisma:seed
fi

exec node dist/main.js
