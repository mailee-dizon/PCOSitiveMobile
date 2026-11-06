import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, hasProfile, isLoading } = useAuth();
  const checkingProfile = Boolean(session) && hasProfile === null;

  useEffect(() => {
    if (!isLoading && !checkingProfile) SplashScreen.hideAsync();
  }, [isLoading, checkingProfile]);

  if (isLoading || checkingProfile) return null;

  const signedIn = Boolean(session);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.pageBg } }}>
      {/* Signed in with a profile → the main app */}
      <Stack.Protected guard={signedIn && hasProfile === true}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      {/* Signed in but onboarding not finished */}
      <Stack.Protected guard={signedIn && hasProfile === false}>
        <Stack.Screen name="questionnaire" />
      </Stack.Protected>

      {/* Signed out → waitlist and sign in */}
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
