# Piloto producción — runbook operativo

Checklist accionable. El código del piloto web está en `master`; lo bloqueante es operativo.

## 1. Backup Postgres — ✅ hecho (infra legacy DO)

> **Nota:** La API de producción migró a **Heroku**. Los IDs de cluster DO ya no aplican; conserva backups en el proveedor Postgres activo (Heroku Postgres o fork).

Comandos de referencia (DigitalOcean Managed PostgreSQL, histórico):

```bash
doctl databases backups <cluster-id>
doctl databases fork lefrig-restore-drill-YYYYMMDD \
  --restore-from-cluster-id <cluster-id> \
  --restore-from-timestamp "YYYY-MM-DD HH:MM:SS +0000 UTC" \
  --wait
# verificar schema/filas, luego:
doctl databases delete <fork-id> --force
```

## 2. Clerk live — email / Google (piloto)

### Estado 2026-07-18
- Instancia **production** OK; dominio primario `lefrig.com` (`clerk.lefrig.com`, `accounts.lefrig.com`).
- Orígenes: `www.lefrig.com`, `lefrig.com`, `admin.lefrig.com`, `staging.lefrig.com`.
- CLI: `npx clerk login` → cuenta con acceso a la instancia production de Clerk.
- `sk_live` sincronizado en DO (prod+staging) y Vercel (`lefrig`, `lefrig-admin`).
- **Auth piloto:** email (código) + Google. SMS/OTP teléfono **fuera** del piloto (plan Clerk bloquea DZ/MR).

### SMS Argelia / Mauritania — aplazado
La API `/instance/communication` tiene **DZ** y **MR** en `blocked_country_codes` (`sms_country_removal_restricted`). Reactivar SMS solo tras upgrade/support Clerk; hasta entonces no hay UI de teléfono en login móvil.

### Webhook — ✅ 2026-07-18
- Endpoint Svix: `https://api.lefrig.com/auth/clerk/webhook` (o URL Heroku mientras no haya CNAME)
- Eventos: `user.created`, `user.updated`, `user.deleted`
- `CLERK_WEBHOOK_SECRET` sincronizado en DO prod + staging
- Script: `node scripts/setup-clerk-webhook-playwright.cjs` (requiere `CLERK_SECRET_KEY`)

Si el endpoint aparece **Disabled** en el portal Svix, habilítalo (badge Disabled → Enable) o ejecuta `node scripts/enable-svix-endpoint.cjs`.

## 3. `ADMIN_SESSION_SECRET` (bloqueante de sesión admin)

Generar un secreto largo (≥ 32 chars) y poner **el mismo valor** en:

| Dónde | Variable |
|-------|----------|
| Vercel → proyecto **admin** | `ADMIN_SESSION_SECRET` |
| DigitalOcean → App API | `ADMIN_SESSION_SECRET` (ya en `.do/app.yaml` como SECRET) |

Sin coincidencia → 401 en el proxy admin. En non-prod puede caer a `CLERK_SECRET_KEY`.

## 4. Alcance del piloto (acordado)

| Incluido | Excluido (fase 2) |
|----------|-------------------|
| Web mobile-first | App stores / EAS production builds firmados |
| Cash + PIN + recibo | Push FCM real (`EXPO_PUBLIC_ENABLE_PUSH=1` cuando haya FCM) |
| Mercado, transport, shops, comunidad | Diáspora pago manual, fiado, vouchers |

Scaffold EAS: `apps/mobile/eas.json`. Activar push solo con FCM real + `eas build`.

## 5. Escala

Instancia API actual: `basic-xxs`. Plan: monitorizar CPU/mem/latency en DO; subir a `basic-xs`/`basic-s` si p95 > 1s o errores 5xx bajo carga piloto.

## 6. Verificación post-deploy

```bash
curl -sS https://<API>/health
# Admin: login → una página con datos (users/orders)
# Web: publicar anuncio + cash create/confirm en dispositivo real
```
