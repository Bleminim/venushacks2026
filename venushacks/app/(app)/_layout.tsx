import { Stack } from 'expo-router';

export default function AppGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup" />
      <Stack.Screen
        name="edit-profile"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}
