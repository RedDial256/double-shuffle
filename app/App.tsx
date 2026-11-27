import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GameEngine } from './src/game/engine';
import { Board } from './src/ui/Board';
import { Hud } from './src/ui/Hud';
import { RulesButton, RulesScreen } from './src/ui/Rules';

export default function App() {
  const engine = useMemo(() => new GameEngine(), []);
  useEffect(() => engine.startMatch(), [engine]);
  const [rulesOpen, setRulesOpen] = useState(false);

  // The game freezes while the rules are open, so a sliding cube or a
  // round-break timer waits for the players to come back.
  const openRules = () => {
    engine.setPaused(true);
    setRulesOpen(true);
  };
  const closeRules = () => {
    setRulesOpen(false);
    engine.setPaused(false);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.fill}>
          <Board engine={engine} />
          <Hud engine={engine} />
          <RulesButton onPress={openRules} />
        </View>
        <RulesScreen visible={rulesOpen} onClose={closeRules} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14171f' },
  fill: { flex: 1 },
});
