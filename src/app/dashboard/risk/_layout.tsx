import { Stack } from "expo-router";

export default function RiskLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="pregnancy-details" />
        </Stack>
    );
}
