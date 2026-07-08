import { Stack } from 'expo-router';

export default function AdolescentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="adolescent-form" />
    </Stack>
  );
}
