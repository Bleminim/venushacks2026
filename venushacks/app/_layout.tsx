import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

import { useColorScheme } from '@/components/useColorScheme';
import { HealthProvider } from '@/context/HealthContext';
import { AuthProvider } from '@/context/AuthContext';
import { CommunityProvider } from '@/context/CommunityContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <AuthProvider>
        <HealthProvider>
          <CommunityProvider>
            <InitialLayout />
          </CommunityProvider>
        </HealthProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
// Lives inside ClerkProvider so it can call useAuth().
// Renders a loading screen while Clerk resolves the session, then redirects
// based on auth state. Auth screens call setActive() and this effect handles
// the navigation automatically — no manual router.replace() needed there.

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user }                 = useUser();
  const segments                 = useSegments();
  const router                   = useRouter();
  const colorScheme              = useColorScheme();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup  = segments[0] === '(auth)';
    const inAppGroup   = segments[0] === '(app)';   // setup lives here
    const needsSetup   = isSignedIn && !user?.firstName;

    if (!isSignedIn && !inAuthGroup) {
      // Signed-out user outside auth screens → send to welcome
      router.replace('/(auth)/welcome');
    } else if (needsSetup && !inAppGroup) {
      // Signed-in but no name yet → send to onboarding
      router.replace('/(app)/setup');
    } else if (isSignedIn && !needsSetup && (inAuthGroup || inAppGroup)) {
      // Fully set-up user on auth/setup screens → send to dashboard
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, user?.firstName, segments]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F4F9' }}>
        <ActivityIndicator color="#9B59B6" size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)"      options={{ headerShown: false }} />
        <Stack.Screen name="(app)"       options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
        <Stack.Screen name="modal"       options={{ presentation: 'modal' }} />
        <Stack.Screen name="thread/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    </ThemeProvider>
  );
}
