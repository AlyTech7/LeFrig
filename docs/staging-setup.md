# Staging — staging.lefrig.com

Entorno pre-producción desplegado. **No compartir** secrets con producción.

## URLs activas

| Servicio | URL |
|----------|-----|
| API staging | https://lefrig-api-staging-lpx9s.ondigitalocean.app |
| API custom (tras DNS) | https://api-staging.lefrig.com |
| Web staging (tras DNS) | https://staging.lefrig.com |
| Web Vercel | https://lefrig-staging.vercel.app (tras primer deploy) |
| DO App ID | `4d6fbbd0-7390-42cb-838e-46bfc2828669` |
| Vercel project | `lefrig-staging` |
| Postgres | DB `lefrig_staging` en cluster `db-postgresql-fra1-62172` |

## DNS en Hostalia (servicio-online.net)

Añade estos registros en el panel DNS de `lefrig.com`:

| Tipo | Nombre | Valor |
|------|--------|-------|
| **A** | `staging` | `76.76.21.21` |
| **CNAME** | `api-staging` | `lefrig-api-staging-lpx9s.ondigitalocean.app` |

Tras propagación (5–30 min):

- https://staging.lefrig.com → Vercel
- https://api-staging.lefrig.com → DigitalOcean (certificado Let's Encrypt automático)

Verificar:

```bash
nslookup staging.lefrig.com
nslookup api-staging.lefrig.com
curl https://api-staging.lefrig.com/health
```

## Clerk

Añadir en Dashboard → Domains: `staging.lefrig.com` (cubierto por `lefrig.com` si ya verificado).

## Arquitectura

| Componente | URL / recurso |
|------------|----------------|
| Web | `https://staging.lefrig.com` (proyecto Vercel separado, branch `master`) |
| API | `https://api-staging.lefrig.com` → app DO `lefrig-api-staging` |
| Postgres | Cluster DO dedicado (Frankfurt) |
| Redis | Managed Redis DO (~$15/mes) — recomendado |
| Meilisearch | Opcional en piloto; búsqueda cae a Postgres ILIKE |

## 1. API en DigitalOcean

1. Crear **nueva app** (no reutilizar `lefrig-api` prod).
2. App Spec: pegar [`.do/app.staging.yaml`](../.do/app.staging.yaml).
3. Secrets en panel DO:
   - `DATABASE_URL` — Postgres staging vacío
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` — distintos de prod
   - `CLERK_SECRET_KEY` — instancia **test** de Clerk o live con dominio staging
   - `REDIS_URL` — `rediss://...` del managed Redis
   - Storage: bucket staging separado (`lefrig-staging`)
4. DNS: `api-staging.lefrig.com` → CNAME de la app DO.
5. Tras primer deploy, verificar `/health` (`db: connected`, `redis: connected`).
6. Seed inicial (una vez, desde tu máquina con acceso a la DB staging):

```bash
DATABASE_URL="postgresql://..." SEED_PROFILE=staging pnpm db:seed
```

## 2. Web en Vercel

1. Nuevo proyecto `lefrig-staging`, root `apps/web`.
2. Variables:
   ```
   NEXT_PUBLIC_API_URL=https://api-staging.lefrig.com
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
3. Dominio custom: `staging.lefrig.com`.
4. Clerk Dashboard → Domains: añadir `staging.lefrig.com`.

## 3. Seed manual (local o CI)

```bash
SEED_PROFILE=staging pnpm db:seed
```

Usuarios demo (OTP mock `123456` si `AUTH_LEGACY_JWT=true`):

| Teléfono | Rol |
|----------|-----|
| +22212345678 | admin |
| +22211111111 | vendedor |
| +22222222222 | tienda |

## 4. Checklist antes de promover a prod

- [ ] E2E verde en CI (`pnpm test:e2e`)
- [ ] `/health` staging: db + redis connected
- [ ] Flujo cash probado en staging
- [ ] Sin `OTP_MOCK_CODE` en prod (`AUTH_LEGACY_JWT=false`)
- [ ] Sentry `SENTRY_ENVIRONMENT=staging` separado de prod

## 5. Redis en producción (piloto)

En app prod [`.do/app.yaml`](../.do/app.yaml), añadir secret `REDIS_URL`:

1. DO → Databases → Create Redis (Frankfurt, basic ~$15/mes).
2. Copiar connection string → `REDIS_URL` en app `lefrig-api`.
3. Redeploy. `/health` debe mostrar `redis: connected`.

Sin Redis: rate limit OTP y caché de campamentos usan memoria in-process (no compartida entre réplicas).

## Meilisearch

Posponer en piloto si hay pocos anuncios. Cuando haya volumen:

1. Meili Cloud o droplet con `getmeili/meilisearch`.
2. `MEILISEARCH_HOST` + `MEILISEARCH_API_KEY` en DO.
3. `MEILI_SYNC_ON_BOOT=true` en staging primero.
