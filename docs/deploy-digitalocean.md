# Desplegar API en DigitalOcean App Platform

## Crear app nueva (recomendado)

1. **Create → App Platform** → GitHub → `AlyTech7/LeFrig` → rama `master`
2. DigitalOcean debe detectar **`.do/app.yaml`** (un solo servicio Docker)
3. Si ofrece autodetect del monorepo → **cancelar** y elegir **Edit App Spec** → pegar contenido de `.do/app.yaml`
4. Rellena secrets: `DATABASE_URL`, `CLERK_SECRET_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLERK_WEBHOOK_SECRET`
5. Región: **Frankfurt (fra)**
6. Create Resources

## Si la app ya existe y falla el build

El error `shared/src typescript:default` = autodetect del monorepo (mal).

1. **Settings → App Spec → Edit**
2. **Borra todo** el YAML actual
3. Copia y pega el contenido de [`.do/app.yaml`](../.do/app.yaml)
4. Save → redeploy

Debe quedar **un solo** `service` llamado `lefrig-api` con `dockerfile_path: apps/api/Dockerfile`.

## Imágenes (obligatorio en prod)

Sin `STORAGE_*` las fotos se guardan en disco efímero y **se pierden al redeploy**.

Configura R2 o DO Spaces — guía completa: [`storage-setup.md`](./storage-setup.md).

Secrets adicionales: `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_PUBLIC_URL`.

## Health check

```
https://[tu-app].ondigitalocean.app/health
```

## Render (alternativa)

Ver [`deploy-render.yaml`](./deploy-render.yaml) — blueprint para Render.com (no dejar en raíz del repo).
