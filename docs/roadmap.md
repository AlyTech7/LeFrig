# Lefrig — Roadmap

## Producción piloto — checklist operativa

Ver runbook detallado: [`docs/production-pilot.md`](./production-pilot.md).

Código de seguridad/calidad (B0–B3) está en `master`. Lo que falta para llamar “producción” de verdad es casi todo **operativo**:

### Bloqueantes absolutos

- [x] **Backup DB verificado** (2026-07-18): clusters DO con backups diarios ~7 días; restore drill OK; cluster temporal destruido.
- [x] **Clerk producción** — instancia `production`, dominio `lefrig.com` / `clerk.lefrig.com`, `sk_live` en DO+Vercel. Auth piloto: **email + Google** (SMS DZ/MR aplazado por plan). Webhook Svix → `whale-app…/auth/clerk/webhook` + `CLERK_WEBHOOK_SECRET` en DO.
- [x] **`ADMIN_SESSION_SECRET` idéntico** — DO API + Vercel `lefrig-admin`; admin redeployed.

### Decisión de alcance (recomendado)

- [x] **Piloto = web mobile-first** (ya desplegable). App nativa (EAS/`eas.json`, FCM real, expo-updates RTL) → **fase 2**, no bloquea lanzar.
- [x] UI no promete flujos mock: copy/legal sin fiado/vouchers/diáspora; admin `/diaspora` redirige; push móvil off (`EXPO_PUBLIC_ENABLE_PUSH`); pedidos sin `manual_transfer`.

### Importante, no bloqueante para piloto

- [x] E2E cash completo (crear → PIN bilateral → recibo) en `apps/e2e/tests/cash-admin.spec.ts`
- [ ] Plan de escala (hoy `basic-xxs`; subir instancia si el piloto tira)
- [ ] Meilisearch / Redis en prod si el volumen lo pide (ver `pilot-infra.md`)

### Deuda técnica conocida (no bloquea piloto)

- [ ] Troceo CSS monolítico / CSS modules
- [ ] Home + marketplace RSC + islas
- [ ] Partir ficheros >600 líneas (`admin.service`, pantallas móvil/web)
- [ ] Adopción opcional de `@lefrig/ui` en admin (paquete web-only)
- [ ] Cobertura de tests más amplia (hoy ~seguridad crítica + humo e2e)

---

## Fase 0 — Fundación ✅ (actual)

- [x] Monorepo Turborepo + pnpm
- [x] Prisma schema completo (50+ modelos)
- [x] Seed demo (campamentos, usuarios, tiendas, anuncios, etc.)
- [x] API NestJS 24 módulos REST
- [x] Auth OTP mock + JWT
- [x] Design system `@lefrig/ui`
- [x] Web pública premium
- [x] Admin panel
- [x] Mobile Expo con offline queue mock
- [x] Docker Compose (PostgreSQL, Redis, Meilisearch)
- [x] Documentación

## Fase 1 — MVP Campamento piloto (4-6 semanas)

### Infraestructura
- [ ] Deploy staging (Railway/Fly.io + Neon/Supabase)
- [x] Migraciones Prisma versionadas (`apps/api/prisma/migrations/`)
- [x] S3/R2 storage real para imágenes (adapter en `storage.adapter.ts`)
- [ ] Meilisearch indexación listings/shops
- [ ] Redis cache + rate limiting
- [x] CI GitHub Actions (ESLint + tsc shared/ui/web/admin/api/mobile + API tests + E2E)
- [x] Guía deploy Vercel (`docs/deploy-vercel.md`)

### Auth & confianza
- [ ] SMS OTP real (Twilio/MessageBird)
- [ ] Verificación comunitaria (moderador local)
- [ ] TrustScore v1 con reglas ponderadas
- [ ] Insignias automáticas

### Marketplace
- [ ] Búsqueda Meilisearch con filtros
- [ ] Compresión imágenes en upload
- [ ] Notificaciones push FCM reales
- [ ] Chat WebSocket básico

### Cash-first
- [ ] Flujo PIN end-to-end testado en campo
- [ ] Recibo PDF/imagen compartible
- [ ] Sync offline cola real en mobile

### Deuda técnica (follow-up calidad)

Movida a la sección **Producción piloto** arriba (no bloquea piloto web).

## Fase 2 — Expansión multi-campamento (6-10 semanas)

- [ ] App nativa tiendas (EAS, FCM real, expo-updates)
- [ ] Transporte: matching conductor-solicitud
- [ ] Traer de Tindouf: flujo completo con tracking
- [ ] Diáspora: integración pago manual verificado
- [ ] Empleo: alertas por campamento
- [ ] Necesidades: SmartMatching v1 (reglas, no ML)
- [ ] Comunidad: moderación por campamento
- [ ] Analytics dashboard para líderes comunitarios
- [ ] i18n completo: árabe RTL, hassanía, español, francés

## Fase 3 — IA & escala (10-16 semanas)

- [ ] Publicar por voz (Whisper)
- [ ] Traducción automática mensajes
- [ ] Categorización y precio sugerido
- [ ] Detección spam/estafa
- [ ] Asistente publicación guiada
- [ ] Inteligencia económica agregada v2
- [ ] Cooperativas: perfiles grupales
- [ ] Escrow mock → partner pagos

## Fase 4 — Producción nacional saharaui

- [ ] Todos los campamentos activos
- [ ] Red transportistas verificados
- [ ] Red tiendas verificadas por marsa
- [ ] Programa vouchers multi-ONG
- [ ] Diáspora: pasarela internacional (Wise/Stripe manual)
- [ ] App stores (Google Play, App Store)
- [ ] Modo ultra-ligero (< 1MB/sesión)
- [ ] Capacitación digital comunitaria

## Backlog técnico

- [ ] E2E Playwright web + admin
- [ ] Tests integración API por módulo
- [ ] OpenAPI client generation para mobile
- [ ] Feature flags
- [ ] Observabilidad (Sentry, logs estructurados)
- [ ] Backup automático DB
- [ ] Auditoría GDPR/privacidad libretas

## Criterios de paso de fase

| Fase | Criterio |
|------|----------|
| 0 → 1 | Arranque local completo, UI premium, seed funcional |
| 1 → 2 | 1 campamento piloto con 50+ usuarios activos |
| 2 → 3 | 3+ campamentos, transporte operativo, diáspora activa |
| 3 → 4 | IA útil en publicación, vouchers ONG en producción |
