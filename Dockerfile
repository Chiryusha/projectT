# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ARG VITE_API_BASE_URL=/api
ARG VITE_ANALYTICS_ENABLED=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ANALYTICS_ENABLED=$VITE_ANALYTICS_ENABLED
RUN npm run build

FROM node:22-alpine AS backend-builder
RUN apk add --no-cache openssl libc6-compat ca-certificates
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
RUN apk add --no-cache openssl libc6-compat ca-certificates
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_DIST_PATH=/app/public/app
ENV PLAYER_IMAGE_CACHE_DIR=/app/public/player-images

COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/public ./public
COPY --from=frontend-builder /app/frontend/dist ./public/app
COPY backend/scripts/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh && mkdir -p /app/public/player-images

EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
