import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load any initial data here (fonts, async storage, etc.)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // IMPORTANT: Don't initialize Firebase here
        // Let each screen handle its own Firebase imports
      } catch (e) {
        console.warn('Error in prepare:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null; // Show native splash screen while loading
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Splash Screen - This will be your initial screen */}
        <Stack.Screen name="index" />

        {/* Auth screens - These won't load until navigated to */}
        <Stack.Screen name="(auth)" />

        {/* Other screens - They won't load until navigated to */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(customer)" />
      
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}