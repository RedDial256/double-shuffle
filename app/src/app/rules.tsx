import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { useGameEngine } from '../ui/GameEngineContext';
import { RulesBody } from '../ui/RulesBody';
import { ScreenHeader } from '../ui/ScreenHeader';

/** The rulebook, opened from Home or from the Pause menu. */
export default function RulesScreen() {
  const engine = useGameEngine();
  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader title="Rules" onBack={() => router.back()} />
      <RulesBody mode={engine.mode} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
