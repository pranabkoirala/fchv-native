import { Stack } from "expo-router";
import React from "react";

export default function ReportLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="service-report" />
      <Stack.Screen name="child-monitoring-report" />
      <Stack.Screen name="maternal-death-report" />
      <Stack.Screen name="newborn-death-report" />
      <Stack.Screen name="child-death-report" />
      <Stack.Screen name="pregnancy-report" />
      <Stack.Screen name="maternal-death-details" />
      <Stack.Screen name="newborn-death-details" />
      <Stack.Screen name="pregnancy-details" />
    </Stack>
  );
}
