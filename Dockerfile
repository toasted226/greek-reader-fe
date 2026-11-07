# Build the Angular browser bundle and SSR server with the project's Bun lockfile.
FROM oven/bun:1.4.2 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Install only runtime dependencies on the same Debian base as the final Node image.
FROM oven/bun:1.4.2 AS bun

FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Run the Angular SSR server with Node; Bun is only used for package management/builds.
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
