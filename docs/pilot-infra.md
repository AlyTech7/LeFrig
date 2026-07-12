# Infraestructura piloto — calidad y escala

Resumen de lo implementado y pendiente operativo antes del piloto en Rabouni/Smara.

## Tests

| Área | Cobertura |
|------|-----------|
| API unit | Clerk, paginación, orders schema, **cash PIN create/confirm/receipt**, rate limit |
| E2E Playwright | 6 smokes + **flujo piloto** (home → sign-in → publicar vía API → marketplace) |
| CI | lint + build admin/web + API tests + **E2E** |

Ejecutar localmente:

```bash
pnpm docker:up          # Postgres + Redis + Meili
pnpm db:migrate && pnpm db:seed
pnpm --filter @lefrig/api dev &
pnpm --filter @lefrig/web dev &
pnpm test:e2e
```

## CI (`.github/workflows/ci.yml`)

- `lint` — turbo lint (web, admin, shared, ui)
- `api` — migrate + vitest + build
- `build-web` / `build-admin`
- `e2e` — seed + API/web en background + Playwright

## Rate limiting

Guard global `@RateLimit()` con Redis si está configurado; **fallback en memoria** si no (CI y dev).

| Endpoint | Límite |
|----------|--------|
| `POST /auth/otp/request` | 8 / hora |
| `POST /auth/otp/verify` | 20 / 10 min |
| `POST /analytics/track` | 120 / min (por IP) |
| `POST /uploads/images` | 30 / min (por usuario) |
| `POST /uploads/images/batch` | 15 / min |

Archivos: `apps/api/src/common/rate-limit/`.

## Staging

Ver [staging-setup.md](./staging-setup.md). Spec DO: `.do/app.staging.yaml`.

## Producción — Redis y Meili

| Servicio | Piloto | Impacto si falta |
|----------|--------|-------------------|
| **Redis** | Recomendado (~$15/mes DO) | Rate limit solo en memoria por instancia; sin caché campamentos |
| **Meilisearch** | Puede esperar | Búsqueda ILIKE en Postgres (aceptable con pocos anuncios) |

`/health` reporta `redis` y `meilisearch` como `connected/configured` u `optional`.

## Pendiente humano

- Crear app DO staging + Vercel staging + DNS
- Añadir `REDIS_URL` en prod DO
- Configurar `SENTRY_DSN` en DO y Vercel
- GitHub Watch en repo para alertas uptime
