import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { GameEngine } from './src/game/engine';
import { Board } from './src/ui/Board';
import { Hud } from './src/ui/Hud';

export default function App() {
  const engine = useMemo(() => new GameEngine(), []);
  useEffect(() => engine.startMatch(), [engine]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.fill}>
          <Board engine={engine} />
          <Hud engine={engine} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14171f' },
  fill: { flex: 1 },
});
