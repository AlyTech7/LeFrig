# Piloto Fase 1 — LeFrig

Checklist operativo para Rabouni / Smara.

## P0 — Implementado en código

| Item | Estado |
|------|--------|
| Mobile: publicar con fotos (picker + compresión + upload) | ✅ |
| Cash: listing → `reserved` → confirmado → `sold` | ✅ |
| Cash: recibo compartible (`GET /cash/receipt/:code`) | ✅ |
| Cash: PIN persistente mobile (AsyncStorage) | ✅ |
| Cash: doble confirm sin duplicados | ✅ |
| TrustScore visible en ficha vendedor (web + mobile) | ✅ |
| Copy piloto sin diáspora/vouchers en footer | ✅ |
| Cash i18n AR con hints hassanía (ⵣ) | ✅ |
| Seguridad: OTP legacy bloqueado en prod | ✅ |
| Monitoring: Sentry + uptime workflow | ✅ |

## Pendiente operativo (humano)

| Item | Acción |
|------|--------|
| 5 ventas reales en campo | Probar flujo cash Rabouni/Smara |
| 2–3 moderadores | Clerk `publicMetadata.roles: ["moderator"]` |
| Webhook Clerk | Login real → verificar `users.clerk_id` |
| Meilisearch prod | Desplegar Meili + env en DO |
| Sentry DSN | Configurar en DO + Vercel |
| FCM push real | Opcional piloto — WhatsApp basta |

## Flujo cash piloto

1. Comprador abre anuncio → **Acordar efectivo**
2. Se genera `CASH-XXXX` + PIN 4 dígitos
3. Anuncio pasa a **reservado**
4. Encuentro en persona — comprador introduce PIN
5. Ambas partes confirman → **recibo** → anuncio **vendido**
6. **Compartir recibo** → WhatsApp

## Mobile publish

1. Categoría → Fotos (cámara/galería, comprimidas) → Detalles → Publicar
2. Mínimo **1 foto** obligatoria
3. Sube a `POST /uploads/images` con JWT Clerk

## Mensaje marketing piloto

> **Lefrig** — Mercado local en tu campamento. Publica, busca y paga en efectivo con PIN seguro.

No promocionar: libreta, diáspora, vouchers (Fase 2).
