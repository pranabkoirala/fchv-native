import React from 'react';
import { Stack } from 'expo-router';

export default function RecordLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add-record" />
    </Stack>
  );
}
