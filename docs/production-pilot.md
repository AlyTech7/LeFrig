# Piloto producción — runbook operativo

Checklist accionable. El código del piloto web está en `master`; lo bloqueante es operativo.

## 1. Backup Postgres (bloqueante) — ✅ hecho 2026-07-18

| Cluster | Uso | Backups |
|---------|-----|---------|
| `db-pgsql-fra1-32508` (`5fd9dfe4-…`) | **Prod** → app `lefrig-api` | Diarios (p. ej. 11–18 jul 2026) |
| `db-postgresql-fra1-62172` (`6bd19a5b-…`) | **Staging** → app `lefrig-api-staging` (DB `lefrig_staging`) | Diarios |

**Restore drill:** fork `lefrig-restore-drill-20260718` desde backup staging `2026-07-18 07:26:11 +0000 UTC`.
Verificado: DB `lefrig_staging` con schema Prisma (53 tablas public) y filas (`users`, `listings`, `cash_agreements`, `camps`). Cluster temporal **destruido** tras la prueba.

Comandos de referencia:

```bash
doctl databases backups <cluster-id>
doctl databases fork lefrig-restore-drill-YYYYMMDD \
  --restore-from-cluster-id <staging-or-prod-id> \
  --restore-from-timestamp "YYYY-MM-DD HH:MM:SS +0000 UTC" \
  --wait
# verificar schema/filas, luego:
doctl databases delete <fork-id> --force
```

Repetir el drill sobre **prod** solo si quieres validar el cluster grande (cuesta un nodo extra mientras exista).

## 2. Clerk live + SMS +213 (bloqueante)

1. Dashboard Clerk → instancia **Production**.
2. Dominios: `lefrig.com`, `www.lefrig.com`, `admin.lefrig.com` (y previews si aplica).
3. Copiar `pk_live_*` / `sk_live_*` a Vercel (web + admin) y `CLERK_SECRET_KEY` a DigitalOcean API.
4. Webhook `user.*` → `https://<API_PUBLIC_URL>/auth/clerk/webhook` con `CLERK_WEBHOOK_SECRET`.
5. Phone auth: proveedor SMS configurado; **probar con 2–3 números reales +213 en Tindouf** (entrega, latencia, OTP usable).
6. `CLERK_AUTHORIZED_PARTIES` y `CORS_ORIGINS` en DO deben listar exactamente los orígenes finales HTTPS.

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
