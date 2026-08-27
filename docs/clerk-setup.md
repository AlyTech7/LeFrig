# Clerk — Configuración Lefrig

## 1. Crear aplicación en Clerk

1. Ve a [dashboard.clerk.com](https://dashboard.clerk.com)
2. Crea una app **Lefrig**
3. Copia las keys a `.env` (raíz y `apps/api/.env`)

## 2. Variables de entorno

```env
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

## 3. Métodos de login en Clerk Dashboard

Piloto (web + móvil): **email** + **Google**. Desactiva Phone/SMS hasta tener plan Clerk con DZ/MR.

Habilita en **User & Authentication**:

- **Email address** (código / magic link) — principal
- **Google** — OAuth
- **Phone number** — desactivado en el piloto (SMS +213 bloqueado por plan)

## 4. Roles (publicMetadata)

En Clerk Dashboard → **Sessions** → **Customize session token**, añade:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

Asigna roles en **Users** → usuario → **Public metadata**:

```json
{
  "roles": ["admin"],
  "campId": "uuid-del-campamento"
}
```

Roles Lefrig: `citizen`, `seller`, `shop_owner`, `driver`, `moderator`, `admin`, `ngo`, `diaspora`

## 5. Webhook (sincronización automática)

En Clerk → **Webhooks** → Add endpoint:

- URL prod: `https://api.lefrig.com/auth/clerk/webhook`
- Eventos: `user.created`, `user.updated`, `user.deleted`
- Copia **Signing secret** → `CLERK_WEBHOOK_SECRET` (DO)

Automatización local: `CLERK_SECRET_KEY=… node scripts/setup-clerk-webhook-playwright.cjs`

## 6. Flujo

```
Usuario login (Clerk) → JWT Clerk
  → Cliente envía Bearer token a API
  → AuthGuard verifica con @clerk/backend
  → ClerkService upsert User en PostgreSQL
  → POST /auth/sync confirma perfil
```

## 7. Admin panel

Solo usuarios con `publicMetadata.roles` que incluya `admin` o `moderator` acceden a `http://localhost:3002`.

## 8. Mobile (Expo)

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` en `.env` (ver `apps/mobile/.env.example`)
- Pantalla `/sign-in` y `/sign-up` con **email** + **Google**; en **iOS** también **Sign in with Apple** (App Store 4.8)
- Token cache en SecureStore (automático con `@clerk/clerk-expo`)

### Google OAuth en móvil

**Expo Go no soporta bien OAuth social** (`useSSO` + scheme `lefrig://`). En Expo Go usa **email**; para Google/Apple hace falta un **development build** o **EAS preview/production**.

En Clerk Dashboard → **Native applications** (o Allowed redirect URLs), añade:

```
lefrig://sso-callback
```

En Google Cloud Console el redirect autorizado sigue siendo el de **Clerk** (p. ej. `https://clerk.lefrig.com/v1/oauth_callback`), no el de la app.

### Sign in with Apple (iOS)

1. Apple Developer → App ID `com.lefrig.app` → capability **Sign In with Apple**
2. Clerk Dashboard → Social connections → **Apple** (Services ID / Key / Team ID según wizard)
3. En la app: `ios.usesAppleSignIn` + plugin `expo-apple-authentication` (ya en `app.json`)

Checklist de tiendas: [`docs/store-release.md`](./store-release.md).

```bash
# APK instalable con Google OAuth
pnpm --filter @lefrig/mobile exec eas build --profile preview --platform android
# AAB production Play Store
pnpm --filter @lefrig/mobile exec eas build --profile production --platform android
```

## 9. Legacy JWT (dev)

Con `AUTH_LEGACY_JWT=true`, el OTP mock (`/auth/otp/*`) sigue funcionando para tests sin Clerk.
