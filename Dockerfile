FROM node:22-alpine  AS base

FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/placeholder-app ./
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./

RUN npm install

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
