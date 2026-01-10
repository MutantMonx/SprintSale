# backend/Dockerfile

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript and Generate Prisma Client
RUN npx prisma generate
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create entrypoint script for auto-migrations
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'npx prisma migrate deploy' >> /app/entrypoint.sh && \
    echo 'node dist/index.js' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

EXPOSE 4000

CMD ["/app/entrypoint.sh"]
