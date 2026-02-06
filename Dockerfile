FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc* ./
RUN pnpm config set node-linker hoisted && pnpm install --frozen-lockfile

FROM base AS prod-deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc* ./
# --ignore-scripts: skip lifecycle scripts (avoids "husky: not found" from prepare)
RUN pnpm config set node-linker hoisted && pnpm install --frozen-lockfile --prod --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before building
RUN pnpm db:generate

RUN pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Production node_modules (includes socket.io, ioredis, tsx, etc.)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Prisma engine binaries (skipped by --ignore-scripts in prod-deps, so copy from builder)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

# package.json (needed by tsx / module resolution)
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Next.js & TypeScript config (needed at runtime by the custom server)
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./

# Source files needed for the custom server (tsx transpiles at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npx", "tsx", "src/server.ts"]
