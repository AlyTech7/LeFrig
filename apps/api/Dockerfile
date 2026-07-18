# LeFrig API — monorepo build
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile

COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm --filter @lefrig/shared build
RUN pnpm --filter @lefrig/api exec prisma generate
RUN pnpm --filter @lefrig/api build
# Bundle portable con deps de producción (pnpm symlinks no sobreviven bien a COPY parcial)
RUN pnpm deploy --filter @lefrig/api --prod /prod/api
# deploy reinstala deps sin el client generado — hay que generarlo en el bundle final
RUN cd /prod/api && npx --yes prisma@6.19.3 generate

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Prisma CLI v6 fijado (evita npx → v7)
RUN npm install -g prisma@6.19.3

COPY --from=builder /prod/api ./
RUN chown -R node:node /app

USER node

EXPOSE 3001

CMD ["sh", "-c", "if [ -z \"$DATABASE_URL\" ]; then echo 'ERROR: DATABASE_URL vacía — configúrala en DO (Run time) y redeploy'; exit 1; fi && prisma migrate deploy && node dist/main.js"]
