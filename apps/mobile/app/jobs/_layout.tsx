import { Stack } from 'expo-router';
import { useT } from '@/lib/locale';

export default function JobsLayout() {
  const t = useT();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('layouts.jobs'), headerShown: false }} />
      <Stack.Screen name="create" options={{ title: t('layouts.publish'), headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: t('layouts.jobOffer'), headerShown: false }} />
    </Stack>
  );
}
