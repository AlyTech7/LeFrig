# Checklist: hacer el repo público en GitHub

Usa esta guía **antes** de cambiar la visibilidad en GitHub → Settings → General → Danger zone → Change repository visibility.

## 1. Auditoría de secretos (obligatorio)

### En el código actual

- [x] No hay `.env` commiteados (solo `.env.example` con placeholders).
- [x] Scripts de ops usan variables de entorno (`scripts/ops/env.ops.example`).
- [x] Emails personales sustituidos por dominios del proyecto en datos demo.
- [ ] **Revisa tú** que no queden tokens en issues, PRs o comentarios de GitHub.

### En el historial de git

El historial **puede** contener emails personales antiguos en `apps/admin/lib/demo-data.ts` (commit inicial). No encontramos `sk_live`, `whsec_` ni tokens Heroku reales en el historial, pero conviene:

```bash
# Buscar patrones sensibles en todo el historial
git log --all -p -G "sk_live_[A-Za-z0-9]{20,}" --oneline
git log --all -p -G "whsec_[A-Za-z0-9+/=]{20,}" --oneline
git log --all -p -G "HRKU-" --oneline
```

Si aparece algo real, **rota el secreto en el proveedor** y considera reescribir historial con [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) o `git filter-repo` antes de publicar.

### Rotación recomendada (por precaución)

Aunque no estén en el repo, rota tras hacer público si nunca lo hiciste:

| Servicio | Qué rotar |
|----------|-----------|
| Clerk | `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| Heroku | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_SESSION_SECRET`, `STORAGE_WORKER_SECRET` |
| Cloudflare R2 / Worker | keys S3 y secret del worker |
| Vercel | env vars sensibles en `lefrig` y `lefrig-admin` |
| GitHub | Personal Access Tokens usados en CI o scripts locales |

## 2. GitHub — configuración del repo

### Al hacer público

1. **Settings → General → Change visibility → Public**
2. **Settings → Actions → General**
   - Fork PRs: desactiva workflows en PRs de forks si no los necesitas (evita secret exfiltration).
3. **Settings → Secrets and variables → Actions**
   - Este repo no usa secrets en workflows actuales; confirma que la lista esté vacía o mínima.
4. **Settings → Code security**
   - Dependabot alerts: **On**
   - Dependabot security updates: **On**
   - Secret scanning: **On** (gratis en repos públicos)
5. **Settings → Branches**
   - Protege `master`: require PR + status checks (CI) antes de merge.

### Issues y discusiones

- Decide si quieres **Issues** abiertos a la comunidad o solo PRs.
- Cierra issues internos de incidentes (`🚨 LeFrig API health check failed`) si ya no aplican.

## 3. Qué es seguro que quede público

| Elemento | ¿Público? | Notas |
|----------|-----------|-------|
| `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` / `pk_live_…` | Sí | Diseñadas para el cliente |
| URL Heroku `*.herokuapp.com` | Sí | Endpoint público |
| `apps/mobile/eas.json` (API URL + pk_live) | Sí | Normal en apps Expo |
| `.github/workflows/uptime.yml` | Sí | Solo hace GET a `/health` |
| Scripts `scripts/*.cjs` | Sí | Requieren env vars locales; sin secretos embebidos |
| `.do/` (legacy DigitalOcean) | Opcional | Infra antigua; puedes borrar la carpeta si ya no usas DO |

## 4. Archivos que NO deben subirse nunca

Ya están en `.gitignore`:

```
.env
.env.*
scripts/ops/.env.ops
.tmp-*
apps/mobile/eas-build-*.json
```

Comprueba antes del push:

```bash
git status
git check-ignore -v apps/mobile/eas-build-err.json   # debe estar ignorado
```

## 5. Documentación legal

- [x] [LICENSE](../LICENSE) — MIT
- [x] [SECURITY.md](../SECURITY.md) — canal de reporte
- [x] [CONTRIBUTING.md](../CONTRIBUTING.md)

Opcional en GitHub:

- Añadir **Description** y **Topics**: `sahrawi`, `marketplace`, `expo`, `nestjs`, `nextjs`, `turborepo`
- Pin README en la home del repo

## 6. Pasos finales (orden sugerido)

```bash
# 1. Commit de esta preparación (si aún no está en master)
git pull
git status

# 2. Verificar CI verde
gh run list --workflow=CI --limit 3

# 3. Hacer público (manual en la web)
# GitHub → AlyTech7/LeFrig → Settings → Danger zone → Change visibility

# 4. Tras publicar
gh repo view --web
# Revisa la pestaña Security → Dependabot + secret scanning
```

## 7. Copia local de ops (solo mantenedores)

```bash
cp scripts/ops/env.ops.example scripts/ops/.env.ops
# Rellena CLERK_SECRET_KEY, CLERK_SVIX_*, DO_APP_IDS si usas scripts legacy
```

---

**Resumen:** el código está preparado para ser público. Lo crítico que queda en tus manos es (1) rotar secretos de producción por precaución, (2) revisar historial git si quieres borrar PII antigua, y (3) pulsar "Make public" en GitHub con branch protection activada.

Publicación en tiendas (Play / App Store): ver [`docs/store-release.md`](./store-release.md).
