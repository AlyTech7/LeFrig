# Contribuir a LeFrig

Gracias por interesarte en LeFrig. Este proyecto es una superapp comunitaria para la diáspora y los campamentos saharauis.

## Antes de abrir un PR

1. Lee [README.md](../README.md) y la guía de inicio rápido.
2. Ejecuta en local:
   ```bash
   pnpm install
   pnpm lint
   pnpm test
   ```
3. Mantén los cambios acotados: un PR por tema (bug, feature, docs).
4. Sigue el estilo existente (TypeScript estricto, ESLint, Prettier).

## Seguridad

No abras issues públicos para vulnerabilidades. Sigue [SECURITY.md](../SECURITY.md).

## Secretos

Nunca subas `.env`, claves de Clerk, tokens de Heroku/Vercel, credenciales R2/S3 ni logs de EAS con sesiones activas.

## Traducciones

Los mensajes de usuario viven en `packages/shared/src/i18n/messages/`. Si añades texto, actualiza **es**, **ar**, **fr** y **en** cuando sea posible.

## Commits

Usa mensajes claros en imperativo, por ejemplo:

- `fix(web): evitar doble submit en checkout cash`
- `docs: actualizar despliegue en Heroku`

## Licencia

Al contribuir, aceptas que tu código se publique bajo la [MIT License](../LICENSE).
