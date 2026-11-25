import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { StoreProvider } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: '#0A0B0D', card: '#0A0B0D' } }}>
      <StatusBar style="light" />
      <StoreProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
      </StoreProvider>
    </ThemeProvider>
  );
}
