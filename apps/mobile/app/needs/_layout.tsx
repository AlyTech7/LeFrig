import { Stack } from 'expo-router';
import { useT } from '@/lib/locale';

export default function NeedsLayout() {
  const t = useT();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('layouts.needs'), headerShown: false }} />
      <Stack.Screen name="create" options={{ title: t('layouts.publish'), headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: t('layouts.needDetail'), headerShown: false }} />
    </Stack>
  );
}
