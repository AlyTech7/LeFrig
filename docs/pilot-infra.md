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

- `lint` — ESLint flat + tsc (shared, ui, web, admin, api, mobile)
- `api` — migrate + vitest + build
- `mobile` — typecheck (también cubierto en lint)
- `build-web` / `build-admin`
- `e2e` — seed + API/web en background + Playwright (smoke, piloto, cash PIN, admin)

## Rate limiting

Guard global `@RateLimit()` con Redis si está configurado; **fallback en memoria** si no (CI y dev).

| Endpoint | Límite |
|----------|--------|
| `POST /auth/otp/request` | 8 / hora |
| `POST /auth/otp/verify` | 20 / 10 min |
| `POST /auth/refresh` | rate-limit (anti-abuso refresh) |
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

## Secrets admin

- `ADMIN_SESSION_SECRET` — mismo valor en **admin (Vercel)** y **API (DigitalOcean)** para firmar/verificar tokens del proxy. Obligatorio en producción en admin; la API lo prefiere y cae a `CLERK_SECRET_KEY` solo si falta.
- `NEXT_PUBLIC_API_URL` — obligatorio en producción admin/web (sin fallback a host hardcodeado).

## Pendiente humano

Ver checklist completa: [production-pilot.md](./production-pilot.md).

- Crear app DO staging + Vercel staging + DNS
- Añadir `REDIS_URL` en prod DO
- Configurar `ADMIN_SESSION_SECRET` en Vercel admin **y** en el panel DO de la API (mismo valor)
- Activar **backup automático** de Postgres (DO) y hacer un restore de prueba antes del piloto
- Clerk **live**: keys, dominio, webhook prod; validar SMS +213 en campo
- Confirmar `CORS_ORIGINS` / `CLERK_AUTHORIZED_PARTIES` con dominios finales
- Configurar `SENTRY_DSN` en DO y Vercel
- GitHub Watch en repo para alertas uptime
