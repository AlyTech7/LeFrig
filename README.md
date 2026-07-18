# Lefrig — Superapp Saharaui

**Lefrig** conecta los campamentos de refugiados saharauis — Aaiún, Smara, Auserd, Dakhla, Rabouni, 27 de Febrero y Tindouf — con la diáspora. No es un simple marketplace de anuncios: es una **infraestructura digital comunitaria** cash-first (efectivo con PIN), transporte, empleo, confianza y comunidad.

> Fiado/vouchers están fuera del producto activo (módulos desmontados; ver `docs/product.md`).

## Stack

| Capa | Tecnología |
|------|------------|
| Monorepo | Turborepo + pnpm |
| API | NestJS + Prisma |
| DB | PostgreSQL (PostGIS-ready) |
| Cache/Colas | Redis-ready |
| Búsqueda | Meilisearch-ready |
| Web | Next.js App Router |
| Admin | Next.js |
| Mobile | Expo React Native |
| UI | `@lefrig/ui` design system |
| Tipos | `@lefrig/shared` + Zod |

## Estructura

```
lefrig/
├── apps/
│   ├── api/          # Backend NestJS REST
│   ├── web/          # Web pública (puerto 3000)
│   ├── admin/        # Panel admin (puerto 3002)
│   └── mobile/       # App Expo
├── packages/
│   ├── shared/       # Tipos, enums, schemas Zod
│   ├── ui/           # Design system + componentes
│   └── config/       # ESLint, TSConfig, Prettier
├── docker-compose.yml
└── docs/
```

## Requisitos

- Node.js ≥ 20
- pnpm ≥ 9
- Docker Desktop (PostgreSQL, Redis, Meilisearch)

## Inicio rápido

```bash
# 1. Clonar e instalar
pnpm install

# 2. Variables de entorno
cp .env.example .env

# 3. Infraestructura
pnpm docker:up

# 4. Base de datos
pnpm db:migrate
pnpm db:seed

# 5. Compilar paquetes compartidos
pnpm --filter @lefrig/shared build
pnpm --filter @lefrig/ui build

# 6. Arrancar todo
pnpm dev
```

## URLs locales

| Servicio | URL |
|----------|-----|
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |
| Web | http://localhost:3000 |
| Admin | http://localhost:3002 |
| Mobile | Expo DevTools (QR) |
| PostgreSQL | localhost:5433 (5433 en host; evita conflicto con PG local) |
| Meilisearch | http://localhost:7700 |
| Prisma Studio | `pnpm db:studio` |

## Credenciales demo

### Clerk (recomendado)
Configura keys en `.env` — ver [docs/clerk-setup.md](docs/clerk-setup.md)

Login: teléfono, email o Google vía Clerk UI en `/sign-in`

### Legacy OTP (solo dev, `AUTH_LEGACY_JWT=true`)

| Rol | Teléfono | OTP |
|-----|----------|-----|
| Admin | +22212345678 | 123456 |
| Vendedor | +22211111111 | 123456 |
| Tienda | +22222222222 | 123456 |
| Conductor | +22233333333 | 123456 |
| Diáspora | +34600000001 | 123456 |

## Scripts

```bash
pnpm dev          # Todos los apps en paralelo
pnpm build        # Build de producción
pnpm lint         # ESLint
pnpm test         # Tests (Vitest/Jest)
pnpm db:migrate   # Migraciones Prisma
pnpm db:seed      # Datos demo
pnpm docker:up    # PostgreSQL + Redis + Meilisearch
```

## Módulos principales

- **Auth** — OTP teléfono, JWT + refresh, roles múltiples
- **Marketplace** — Anuncios con reserva, PIN, efectivo
- **Cash-first** — Acuerdos, confirmaciones, recibos digitales
- **Libreta/Fiado** — Crédito privado tienda-cliente
- **Tiendas/Marsas** — Catálogo, pedidos, fiado, vouchers
- **Transporte** — Taxis, entregas, traer de Tindouf
- **Diáspora** — Pedidos para familiares con pago manual mock
- **Vouchers** — Programas ONG separados del fiado privado
- **Empleo** — Ofertas y búsqueda de trabajo
- **Necesidades** — Smart matching mock
- **Comunidad** — Avisos, eventos, ayuda urgente
- **Reputación** — Reviews, badges, TrustScore
- **Moderación** — Reportes, disputas, logs admin
- **IA-ready** — Servicios mock (voz, traducción, categorización)
- **Offline-first** — Cola local en mobile

## Principios de diseño

1. Mobile-first, offline-first, cash-first
2. Árabe/Hassanía first (RTL ready)
3. UX simple como WhatsApp por fuera, potente por dentro
4. Privacidad: libreta y vouchers separados de reputación pública
5. No somos banco — organizamos operaciones, no movemos dinero

## Documentación

- [Producto](docs/product.md)
- [Arquitectura](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Design System](docs/design-system.md)
- [Despliegue Vercel](docs/deploy-vercel.md)
- [Clerk](docs/clerk-setup.md)

## Despliegue en producción

La **web** se despliega en **Vercel** (`apps/web`). La **API** NestJS va en un host separado (Railway, Fly.io, Render, Docker).

```bash
# 1. API: migrar base de datos
pnpm --filter @lefrig/api exec prisma migrate deploy

# 2. Web: build local de verificación
pnpm turbo run build --filter=@lefrig/web
```

Plantilla de variables: [`.env.production.example`](.env.production.example)

Guía completa: **[docs/deploy-vercel.md](docs/deploy-vercel.md)**

## Licencia

Privado — Proyecto comunitario saharaui.
