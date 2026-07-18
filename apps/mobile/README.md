# Lefrig mobile (Expo)

Piloto de lanzamiento: **web first**. Esta app no bloquea el piloto.

## Estado

- Typecheck/lint: OK
- Push remoto: **off** por defecto (`EXPO_PUBLIC_ENABLE_PUSH=1` para activar)
- Builds tienda: scaffold en [`eas.json`](./eas.json) — falta cuenta EAS, credenciales, FCM real y `expo-updates`

## Comandos

```bash
pnpm --filter @lefrig/mobile dev
# Cuando haya proyecto EAS:
# npx eas-cli@latest login
# npx eas-cli@latest build --profile preview --platform android
```

Ver `docs/production-pilot.md`.
