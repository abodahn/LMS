# T&C AI Academy — production image
#
# Deliberately a single build stage plus a slim runtime copy. `next build`
# output, the generated Prisma client and the native better-sqlite3 binding all
# have to agree on the same Node version and libc, so they are built and run on
# the same base image.

FROM node:22-bookworm-slim AS build
WORKDIR /app

# Native modules (better-sqlite3) need a toolchain at install time only.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# `prisma generate` writes src/generated/prisma, which the build imports.
RUN npx prisma generate && npm run build


FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Uploads and the SQLite file live on a volume, never in the image layer.
ENV STORAGE_DIR=/data/storage

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/next.config.ts ./next.config.ts
# The seeds and operator scripts run through tsx at start-up, so their sources
# and the path aliases they resolve against have to be in the runtime image.
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/tsconfig.json ./tsconfig.json
# The reviewed catalogue, replayed on first boot. Without this the image starts
# with only the 55 courses the seeds build in code, and the import fails
# silently because the file it wants is not there.
COPY --from=build /app/data ./data
# Unicode fonts for certificates (Latin, Turkish and Arabic); OFL licences beside them.
COPY --from=build /app/assets ./assets

RUN mkdir -p /data/storage && chown -R node:node /data /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

# Migrations first, so a new image can never serve an old schema; then the
# bootstrap, which seeds reference data only when the database is empty. Both
# are idempotent, so a restart loop is harmless.
CMD ["sh", "-c", "npx tsx scripts/restore.mts --boot && npx prisma migrate deploy && npx tsx scripts/bootstrap.mts && npm run start"]
