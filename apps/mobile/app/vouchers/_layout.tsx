import { Stack } from 'expo-router';
import { useT } from '@/lib/locale';

export default function VouchersLayout() {
  const t = useT();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('layouts.vouchers'), headerShown: false }} />
    </Stack>
  );
}
