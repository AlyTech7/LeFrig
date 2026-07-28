import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#faf8f4' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="personal" />
      <Stack.Screen name="security" />
      <Stack.Screen name="delete" />
    </Stack>
  );
}
