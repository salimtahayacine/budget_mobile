import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { GoogleTokens, useGoogleAuthRequest } from './src/services/googleAuth';
import { useStore } from './src/store';
import { colors } from './src/theme';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

// Le hook OAuth doit vivre ici (racine) pour que promptAsync soit
// disponible dans SettingsScreen via le store.
function AppInner() {
  const hydrated         = useStore((s) => s.hydrated);
  const hydrate          = useStore((s) => s.hydrate);
  const setGoogleTokens  = useStore((s) => s.setGoogleTokens);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Le hook est instancié ici mais le SettingsScreen l'instancie aussi
  // séparément pour accéder à promptAsync — c'est le pattern expo-auth-session.
  const onTokens = useCallback((t: GoogleTokens) => {
    setGoogleTokens(t);
  }, [setGoogleTokens]);

  useGoogleAuthRequest(onTokens);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppInner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
