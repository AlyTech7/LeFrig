# Despliegue Admin — `apps/admin`

Panel de administración en **Vercel** (proyecto separado de la web).

## Arquitectura

```
admin.lefrig.com  ──►  Vercel (lefrig-admin, apps/admin)
                              │
                              │ Bearer JWT (Clerk)
                              ▼
                    api.lefrig.com / Heroku  (API)
```

## 1. Proyecto Vercel

| Campo | Valor |
|-------|-------|
| **Nombre** | `lefrig-admin` |
| **Root Directory** | `apps/admin` |
| **Include files outside Root** | ✅ |
| **Node.js** | 24.x |

Comandos en [`apps/admin/vercel.json`](../apps/admin/vercel.json).

## 2. Variables de entorno (Production)

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.lefrig.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` (misma app Clerk que web) |
| `CLERK_SECRET_KEY` | `sk_live_...` |

Opcional (redirects en el dominio admin):

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` |

## 3. Clerk Dashboard

1. **Domains** → añadir `admin.lefrig.com` y `*.vercel.app` del proyecto admin
2. Usuario admin: `publicMetadata.roles` debe incluir `"admin"` (o `"moderator"` para acceso limitado)
3. Session token: incluir metadata (ver [clerk-setup.md](./clerk-setup.md))

## 4. API — CORS

Añadir el dominio admin a `CORS_ORIGINS` en DigitalOcean:

```
https://www.lefrig.com,https://lefrig.com,https://lefrig.vercel.app,https://admin.lefrig.com,https://lefrig-admin.vercel.app
```

## 5. DNS

CNAME `admin` → `cname.vercel-dns.com` (registro que indique Vercel al añadir el dominio).

## 6. Deploy CLI

```bash
cd apps/admin
npx vercel link --project lefrig-admin
npx vercel --prod
```

## 7. Verificación

- [ ] `/sign-in` — Clerk carga
- [ ] Usuario sin rol → `/unauthorized`
- [ ] Usuario `admin` → dashboard sin banner demo
- [ ] Network: `GET /admin/overview` → 200 con Bearer token
- [ ] `robots.txt` → `Disallow: /`

## Auth

| Capa | Regla |
|------|-------|
| Middleware admin | `admin` o `moderator` en Clerk metadata |
| API `/admin/*` | Solo rol `admin` |
| API `/moderation/*` | `moderator` o `admin` |
