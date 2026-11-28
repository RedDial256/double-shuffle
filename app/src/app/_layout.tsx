import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '../theme';
import { GameEngineProvider } from '../ui/GameEngineContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={rootStyle}>
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
          <Stack.Screen name="history" />
          <Stack.Screen name="settings" />
        </Stack>
      </GameEngineProvider>
    </GestureHandlerRootView>
  );
}

const rootStyle = { flex: 1 } as const;
