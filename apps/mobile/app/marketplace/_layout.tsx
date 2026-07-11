import { Stack } from 'expo-router';
import { useT } from '@/lib/locale';

export default function MarketplaceLayout() {
  const t = useT();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('layouts.marketplace'), headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: t('layouts.listing'), headerShown: false }} />
      <Stack.Screen name="create" options={{ title: t('layouts.publish') }} />
    </Stack>
  );
}
