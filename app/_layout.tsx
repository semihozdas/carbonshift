import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user, bootstrapping } = useAuth();

  useEffect(() => {
    if (bootstrapping) return;
    const inAuth = segments[0] === 'auth';
    const onSplash = segments.length === 0 || segments[0] === 'index';
    if (!user && !inAuth && !onSplash) {
      router.replace('/auth');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, bootstrapping, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <AuthGate />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="rewards" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
