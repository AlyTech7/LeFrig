# Almacenamiento de imágenes (producción)

En DigitalOcean App Platform el disco del contenedor es **efímero**: sin object storage, las fotos desaparecen en cada redeploy.

LeFrig usa un adapter S3-compatible (`apps/api/src/adapters/storage.adapter.ts`). Recomendado: **Cloudflare R2** (barato, CDN integrado).

## 1. Crear bucket R2

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → **Create bucket**
2. Nombre: `lefrig`
3. Región: Western Europe (cerca de Frankfurt)

## 2. Acceso público (CDN)

**Opción A — dominio custom (recomendado)**

1. R2 → bucket `lefrig` → **Settings** → **Public access** → **Custom domain**
2. Añade `cdn.lefrig.com` (CNAME en tu DNS hacia la URL que indique Cloudflare)
3. `STORAGE_PUBLIC_URL=https://cdn.lefrig.com`

**Opción B — r2.dev (rápido para probar)**

1. **Settings** → **Public access** → Enable `*.r2.dev`
2. `STORAGE_PUBLIC_URL=https://pub-xxxxx.r2.dev`

## 3. API token R2

1. R2 → **Manage R2 API Tokens** → **Create API token**
2. Permisos: Object Read & Write en bucket `lefrig`
3. Copia Access Key ID y Secret Access Key

## 4. Variables en DigitalOcean

En App Platform → **lefrig-api** → **Settings** → **Environment variables**:

| Variable | Ejemplo |
|----------|---------|
| `STORAGE_ENDPOINT` | `https://ACCOUNT_ID.r2.cloudflarestorage.com` |
| `STORAGE_BUCKET` | `lefrig` |
| `STORAGE_ACCESS_KEY` | (token) |
| `STORAGE_SECRET_KEY` | (token) |
| `STORAGE_PUBLIC_URL` | `https://cdn.lefrig.com` |
| `STORAGE_REGION` | `auto` |
| `STORAGE_FORCE_PATH_STYLE` | `true` |

Redeploy la API.

## 5. Verificar

```bash
curl https://whale-app-xpe4g.ondigitalocean.app/health
```

Debe mostrar:

```json
{
  "storage": "s3",
  "storagePersistent": true,
  "storagePublicUrl": "https://cdn.lefrig.com"
}
```

Sube una foto desde [lefrig.com/marketplace/create](https://www.lefrig.com/marketplace/create). La URL devuelta debe empezar por `STORAGE_PUBLIC_URL`, no por `ondigitalocean.app/uploads`.

## Alternativa: DigitalOcean Spaces (configurado en prod)

LeFrig usa **DO Spaces** en `fra1` (misma región que la API):

| Variable | Valor |
|----------|-------|
| `STORAGE_ENDPOINT` | `https://fra1.digitaloceanspaces.com` |
| `STORAGE_BUCKET` | `lefrig` |
| `STORAGE_PUBLIC_URL` | `https://lefrig.fra1.digitaloceanspaces.com` |
| `STORAGE_REGION` | `fra1` |
| `STORAGE_FORCE_PATH_STYLE` | `false` |

Crear keys: `doctl spaces keys create lefrig-api --grants 'bucket=lefrig;permission=readwrite'`

---

## Cloudflare R2 (alternativa)

1. **Create → Spaces** → región `fra1`, nombre `lefrig`
2. **Settings** → CDN enabled
3. Crea **Spaces access keys**
4. Variables:

| Variable | Valor |
|----------|-------|
| `STORAGE_ENDPOINT` | `https://fra1.digitaloceanspaces.com` |
| `STORAGE_BUCKET` | `lefrig` |
| `STORAGE_PUBLIC_URL` | `https://lefrig.fra1.cdn.digitaloceanspaces.com` |
| `STORAGE_FORCE_PATH_STYLE` | `false` |

## Desarrollo local

Sin credenciales S3, la API guarda en `uploads/` y sirve en `http://localhost:3001/uploads/...`.
