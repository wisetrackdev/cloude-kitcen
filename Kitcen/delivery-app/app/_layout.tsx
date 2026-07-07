import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { safeStorage } from '../store/safeStorage';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const checkFingerprintLock = async () => {
      try {
        const isEnabled = await safeStorage.getItem('isFingerprintEnabled');
        if (isEnabled === 'true') {
          router.replace('/lock');
        }
      } catch (err) {
        console.warn('Error reading fingerprint lock state:', err);
      }
    };
    checkFingerprintLock();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0A' },
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="fingerprint" options={{ headerShown: false }} />
        <Stack.Screen name="lock" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
