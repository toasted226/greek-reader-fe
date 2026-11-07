# 1. Build Stage: Node 22 base with Bun copied in
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Copy the Bun CLI from the official image
COPY --from=oven/bun:1.4.2 /usr/local/bin/bun /usr/local/bin/bun

# Install dependencies using Bun and bun.lock
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy app source and build using Node (which supports Angular's memory: SSR loader)
COPY . .
RUN node ./node_modules/@angular/cli/bin/ng.js build

# 2. Production Dependencies Stage
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY --from=oven/bun:1.4.2 /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# 3. Production Runtime Stage
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    API_BASE_URL=https://greek-reader-api.modulrza.app
WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist/greek-reader ./dist/greek-reader

USER node
EXPOSE 4000
CMD ["node", "dist/greek-reader/server/server.mjs"]
