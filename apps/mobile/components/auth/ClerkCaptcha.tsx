import { Platform, View } from 'react-native';

/**
 * Placeholder obligatorio para Bot Protection de Clerk.
 * En web se renderiza el widget; en nativo Clerk usa fallback invisible.
 */
export function ClerkCaptcha() {
  if (Platform.OS === 'web') {
    return <div id="clerk-captcha" />;
  }
  return <View nativeID="clerk-captcha" collapsable={false} />;
}
