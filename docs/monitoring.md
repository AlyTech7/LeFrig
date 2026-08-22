# Monitoring — LeFrig

Observabilidad mínima: errores en Sentry + uptime con alertas nocturnas.

## 1. Sentry (errores en runtime)

Crea **3 proyectos** en [sentry.io](https://sentry.io) (o uno por app):

| App | Plataforma | Variable |
|-----|------------|----------|
| API | Node/NestJS | `SENTRY_DSN` |
| Web | Next.js | `NEXT_PUBLIC_SENTRY_DSN` |
| Admin | Next.js | `NEXT_PUBLIC_SENTRY_DSN` |

Opcional (source maps en build Vercel):

| Variable | Dónde |
|----------|-------|
| `SENTRY_ORG` | Vercel build |
| `SENTRY_PROJECT` | `lefrig-web` / `lefrig-admin` |
| `SENTRY_AUTH_TOKEN` | Vercel secret (Settings → Auth Tokens) |

Sin DSN, Sentry no se activa — el build y runtime siguen funcionando.

### Dónde configurar

| Servicio | Variables |
|----------|-----------|
| **DigitalOcean** (API) | `SENTRY_DSN`, opcional `SENTRY_ENVIRONMENT=production` |
| **Vercel lefrig** (web) | `NEXT_PUBLIC_SENTRY_DSN` |
| **Vercel lefrig-admin** | `NEXT_PUBLIC_SENTRY_DSN` |

En Sentry → **Alerts** → New alert rule → “Issues” / “Number of events” → notificación email o Slack.

## 2. Uptime — `/health` cada 5 min

Workflow [`.github/workflows/uptime.yml`](../.github/workflows/uptime.yml):

- `GET https://api.lefrig.com/health`
- Falla si HTTP ≠ 200, `status !== ok` o `db !== connected`
- Abre un **GitHub Issue** automático (sin duplicar si ya hay uno abierto)

### Recibir alertas

1. GitHub → repo **LeFrig** → **Watch** → **All Activity** (o Custom → Actions)
2. Activa notificaciones email en tu perfil GitHub

También puedes ejecutar manualmente: **Actions** → **Production uptime** → **Run workflow**.

## 3. Health endpoint

`GET /health` responde:

| Condición | HTTP | `status` | `db` |
|-----------|------|----------|------|
| DB OK | 200 | `ok` | `connected` |
| DB caída | **503** | `degraded` | `disconnected` |

Los monitores externos deben tratar **503 como down**.

## 4. Checklist producción

- [ ] `SENTRY_DSN` en DigitalOcean API
- [ ] `NEXT_PUBLIC_SENTRY_DSN` en Vercel web + admin
- [ ] Alertas email en Sentry (cada proyecto)
- [ ] GitHub Watch activado para recibir fallos del workflow uptime
- [ ] Probar: `curl -i https://api.lefrig.com/health` → 200
