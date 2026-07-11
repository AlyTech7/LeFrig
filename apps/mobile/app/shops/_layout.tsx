import { Stack } from 'expo-router';
import { useT } from '@/lib/locale';

export default function ShopsLayout() {
  const t = useT();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('layouts.shops'), headerShown: false }} />
      <Stack.Screen name="register" options={{ title: t('layouts.register'), headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: t('layouts.shop'), headerShown: false }} />
      <Stack.Screen name="[id]/products" options={{ title: t('layouts.myProducts') }} />
    </Stack>
  );
}
