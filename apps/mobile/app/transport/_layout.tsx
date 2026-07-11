import { Stack } from 'expo-router';
import { useT } from '@/lib/locale';

export default function TransportLayout() {
  const t = useT();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('layouts.transport'), headerShown: false }} />
      <Stack.Screen name="request" options={{ title: t('layouts.request'), headerShown: false }} />
      <Stack.Screen name="tindouf" options={{ title: t('layouts.tindoufRoute') }} />
      <Stack.Screen name="register" options={{ title: t('layouts.driverRegister'), headerShown: false }} />
    </Stack>
  );
}
