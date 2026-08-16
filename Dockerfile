# D365FO MCP server — cloud (read-only) image.
#
# This image serves the READ half of the toolset: search, object info,
# knowledge, and `d365fo_file action=generate` (which only authors XML and
# needs no Windows). The WRITE half — file writes, xppc builds, DB sync —
# runs on the customer's own Windows VM as a second MCP server started with
# MCP_SERVER_MODE=write-only. See src/server/serverMode.ts for the partition.
#
# The symbol index lives in Neon Postgres, not in this image: with
# NEON_DATABASE_URL set the server never opens the local SQLite file and never
# re-indexes on boot (src/index.ts, `indexIsRemote`). That is what keeps the
# image ~200 MB instead of shipping a 2.8 GB database.
#
# node:sqlite is used for the in-memory stub index, so the runtime must be
# Node 24+ (package.json `engines`). No native modules are compiled here —
# there is no better-sqlite3 in the dependency tree.

# ---------- build ----------
FROM node:24-slim AS builder
WORKDIR /app

# Lockfile-only layer so `npm ci` is cached across source edits.
#
# --ignore-scripts is required, not tidiness: package.json has a `prepare` script
# (which is what makes `npm i -g github:...` work for customers), and npm runs
# `prepare` on install. Here that would run `tsc` at a point where only the
# lockfile has been copied and src/ does not exist yet, failing the build. The
# explicit `npm run build` below is the one that matters.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

# `npm run build` = tsc + esbuild. The esbuild half also emits
# dist/scripts/symbolCountsWorker.js, which XppSymbolIndex spawns as a worker
# thread; skipping it would break the local-SQLite path in any non-Neon build
# of this image.
RUN npm run build

# ---------- runtime ----------
FROM node:24-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run gives no TTY, so stdin is not a TTY and the server would otherwise
# auto-detect stdio mode and never bind a port (src/index.ts, `isStdioMode`).
ENV MCP_FORCE_HTTP=true
# Read-only: never publish the local-filesystem tools from a container that has
# no K:\ drive and no xppc.
ENV MCP_SERVER_MODE=read-only

COPY package.json package-lock.json ./
# --ignore-scripts again: `prepare` would try to build here, and this stage has
# no devDependencies (no tsc, no esbuild) and no sources. dist/ is copied from
# the builder below.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT; 8080 matches its default and the src/index.ts default.
EXPOSE 8080

# Run unprivileged — the node image ships a `node` user (uid 1000).
USER node

CMD ["node", "dist/index.js"]
