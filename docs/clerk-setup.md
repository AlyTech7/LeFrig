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

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` en `.env`
- Pantalla `/sign-in` y `/sign-up` con **email** + **Google**
- Token cache en SecureStore (automático con `@clerk/clerk-expo`)

## 9. Legacy JWT (dev)

Con `AUTH_LEGACY_JWT=true`, el OTP mock (`/auth/otp/*`) sigue funcionando para tests sin Clerk.
