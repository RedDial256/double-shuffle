import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '../theme';
import { GameEngineProvider } from '../ui/GameEngineContext';

export default function RootLayout() {
  return (
    <GameEngineProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="new-match" />
        {/* No swipe back out of a match: leaving goes through Pause. */}
        <Stack.Screen name="game" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="pause"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: colors.transparent },
          }}
        />
        <Stack.Screen name="rules" />
        <Stack.Screen name="settings" />
      </Stack>
    </GameEngineProvider>
  );
}
