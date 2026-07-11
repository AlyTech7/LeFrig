import { Stack } from 'expo-router';
import { useT } from '@/lib/locale';

export default function LedgerLayout() {
  const t = useT();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('layouts.ledger'), headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: t('layouts.account'), headerShown: false }} />
    </Stack>
  );
}
