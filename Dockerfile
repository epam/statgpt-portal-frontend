FROM node:24.22.1-alpine3.24 AS base

# Upgrade OS packages with known CVEs in the base image (openssl CVE-2026-14456,
# zlib CVE-2026-85091). zlib is preinstalled, so `apk add` would not update it.
RUN apk upgrade --no-cache libcrypto3 libssl3 zlib

FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/portals-example ./
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./

# Runtime starts with node directly. Project overrides do not patch global npm's
# bundled dependencies (brace-expansion, ip-address, tar, undici), so remove
# npm/npx and its cache after the last install. The generated package.json has
# no matching lockfile, so `npm ci` is not an option here.
RUN npm install --omit=dev \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

USER nextjs

EXPOSE 3000

CMD ["node", "/app/node_modules/next/dist/bin/next", "start"]
