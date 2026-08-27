# Publicación Play Store + App Store (Lefrig mobile)

Checklist operativa para `apps/mobile` (Expo SDK 54, bundle `com.lefrig.app`).

## URLs públicas (obligatorias)

| Uso | URL |
| --- | --- |
| Privacidad | https://www.lefrig.com/legal#privacidad |
| Términos | https://www.lefrig.com/legal#terminos |
| Eliminar cuenta (Play) | https://www.lefrig.com/account-deletion |
| Soporte | hola@lefrig.com |

## Antes del build production

1. **Clerk Dashboard**
   - Native application: scheme `lefrig`, redirect `lefrig://sso-callback`
   - Social: **Google** + **Apple** (Sign in with Apple) activos en producción
   - Claves live (`pk_live_` / `sk_live_`) en EAS / Heroku / Vercel
2. **Apple Developer**
   - App ID `com.lefrig.app` con capability **Sign In with Apple**
   - Certificados + provisioning (EAS puede gestionarlos)
   - Crear app en App Store Connect → copiar **Apple ID numérico** a `eas.json` → `submit.production.ios.ascAppId`
3. **Google Play Console**
   - App creada, package `com.lefrig.app`
   - Service account JSON para `eas submit` (opcional; o subir AAB a mano)
   - Completar **Data safety**, política de privacidad y URL de eliminación de cuenta
4. **Código ya preparado en repo**
   - `app.json` v1.0.0, permisos cámara/fotos, `usesAppleSignIn`, encryption exempt
   - Botón Apple en iOS (`defaultAuthProviders`)
   - Página web `/account-deletion`
   - Perfil `eas.json` → `production` (AAB Android)

## Builds EAS

```bash
cd apps/mobile
eas login
eas build --platform android --profile production --non-interactive
# iOS requiere Apple creds + ascAppId real:
eas build --platform ios --profile production
```

Submit (cuando el listing esté listo):

```bash
eas submit --platform android --profile production --latest
eas submit --platform ios --profile production --latest
```

## Consolas (manual — no automatizable)

### Google Play

- [ ] Ficha: título, descripción corta/larga, icono 512, feature graphic, screenshots teléfono
- [ ] Categoría, contacto `hola@lefrig.com`, URL privacidad + account-deletion
- [ ] Data safety: datos recogidos (cuenta, fotos, mensajes…), cifrado en tránsito, eliminación de cuenta
- [ ] Clasificación de contenido, público objetivo
- [ ] Subir AAB production → pista **interna** / cerrada → producción

### App Store Connect

- [ ] Privacy Nutrition Labels alineados con la política
- [ ] Screenshots iPhone (y iPad si `supportsTablet`)
- [ ] Review notes: cuenta demo si hace falta; explicar efectivo / comunidad
- [ ] App Privacy → Sign in with Apple presente junto a Google
- [ ] Export compliance: ITSAppUsesNonExemptEncryption = false (ya en app.json)

## Verificación post-build

1. Instalar el binario (no Expo Go).
2. Sign-in email + Google; en iOS también Apple.
3. Flujo eliminar cuenta en app y comprobar enlace web.
4. Cámara / galería piden permiso con los textos de `app.json`.

## Qué no cubre este doc

Credenciales de Apple/Google, capturas reales, rellenar formularios de Data safety / Privacy labels, ni la revisión humana de las tiendas.
