# Despliegue en Vercel — LeFrig Web

Guía para desplegar `apps/web` en Vercel con la API en un host separado.

## Arquitectura

| Servicio | Host recomendado |
|----------|------------------|
| **Web** (`apps/web`) | **Vercel** |
| **API** (`apps/api`) | Railway, Fly.io, Render, VPS + Docker |
| **PostgreSQL** | Neon, Supabase, RDS (PostGIS recomendado) |
| **Storage imágenes** | Cloudflare R2 o AWS S3 |
| **Redis / Meilisearch** | Opcional (Upstash, Meili Cloud) |
| **Admin** (`apps/admin`) | Segundo proyecto Vercel (opcional) |
| **Mobile** | Expo EAS — independiente |

## 1. Desplegar la API primero

```bash
# Generar cliente y migrar (en el host de la API)
pnpm --filter @lefrig/api exec prisma generate
pnpm --filter @lefrig/api exec prisma migrate deploy

# Seed solo en staging (no en producción)
pnpm db:seed
```

Variables obligatorias en la API — ver [`.env.production.example`](../.env.production.example):

- `DATABASE_URL`
- `API_PUBLIC_URL` — URL pública HTTPS de la API
- `CORS_ORIGINS` — dominio Vercel + custom domain
- `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- `AUTH_LEGACY_JWT=false`
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — mínimo 32 caracteres aleatorios
- `ENABLE_SWAGGER=false`
- `STORAGE_*` — R2/S3 en producción

Webhook Clerk: `POST https://api.tudominio.com/auth/clerk/webhook`

Health check: `GET https://api.tudominio.com/health`

## 2. Proyecto Vercel (web)

### Configuración del proyecto

| Campo | Valor |
|-------|-------|
| **Root Directory** | `apps/web` |
| **Framework** | Next.js |
| **Include files outside Root** | ✅ Activado |
| **Node.js** | 20.x |

Los comandos ya están en [`apps/web/vercel.json`](../apps/web/vercel.json):

- **Install:** `cd ../.. && pnpm install`
- **Build:** `cd ../.. && pnpm turbo run build --filter=@lefrig/web`

### Variables de entorno en Vercel

| Variable | Ejemplo |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://api.tudominio.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
| `CLERK_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_SITE_URL` | `https://tudominio.com` |
| `NEXT_PUBLIC_APP_NAME` | `Lefrig` |

**No** configures `NEXT_PUBLIC_ALLOW_DEMO_FALLBACK` en producción.

### Clerk Dashboard

1. Crear app **Production**
2. Añadir dominios: `*.vercel.app` y tu dominio custom
3. Configurar webhook → API
4. URLs de redirect: `/sign-in`, `/sign-up`

Ver también [clerk-setup.md](./clerk-setup.md).

## 3. Verificación post-deploy

- [ ] Home y Atlas cargan
- [ ] Buscador «Coches» → marketplace filtrado
- [ ] Sign-in Clerk funciona
- [ ] Marketplace muestra datos **reales** (sin banner demo)
- [ ] Upload de imagen al publicar anuncio
- [ ] Rutas privadas redirigen sin sesión (`/orders`, `/messages`)
- [ ] `robots.txt` y `sitemap.xml` accesibles

Tests manuales:

```bash
pnpm test:e2e   # requiere web + API en local
```

## 4. Admin (opcional)

Segundo proyecto Vercel con Root = `apps/admin`, mismas env vars que web.

Build: `cd ../.. && pnpm turbo run build --filter=@lefrig/admin`

## 5. Docker (alternativa self-hosted)

```bash
cp .env.example .env
# Editar secrets de producción
pnpm docker:prod
```

Ver `docker-compose.prod.yml`. La web usa `DOCKER_BUILD=true` para output standalone.

## 6. Troubleshooting

| Problema | Solución |
|----------|----------|
| Build falla: `@lefrig/shared` not found | Usar `pnpm turbo run build --filter=@lefrig/web`, no solo `next build` |
| CORS error en browser | Añadir dominio Vercel a `CORS_ORIGINS` en la API |
| Datos demo en prod | Quitar `NEXT_PUBLIC_ALLOW_DEMO_FALLBACK`; verificar API URL |
| Clerk no protege rutas | Comprobar `CLERK_SECRET_KEY` en Vercel |
| Imágenes rotas | Configurar R2/S3 + `STORAGE_PUBLIC_URL` |
| `migrate deploy` falla | Commitear `apps/api/prisma/migrations/` |

## Referencias

- [README](../README.md)
- [Roadmap](./roadmap.md)
- [Clerk setup](./clerk-setup.md)
- [`.env.production.example`](../.env.production.example)
