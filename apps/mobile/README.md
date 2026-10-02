# Lefrig mobile (Expo)

Piloto de lanzamiento: **web first**. Esta app no bloquea el piloto.

**Google Play:** publicada — https://play.google.com/store/apps/details?id=com.lefrig.app  
**App Store:** pendiente (no declarar como disponible).

## Estado

- Typecheck/lint: OK
- Push remoto: **off** por defecto (`EXPO_PUBLIC_ENABLE_PUSH=1` para activar)
- Builds tienda: scaffold en [`eas.json`](./eas.json) — FCM real y `expo-updates` pendientes; Android ya en Play

## Comandos

```bash
pnpm --filter @lefrig/mobile dev
# Cuando haya proyecto EAS:
# npx eas-cli@latest login
# npx eas-cli@latest build --profile preview --platform android
```

Ver `docs/production-pilot.md`.
