import { useCallback, useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { Board } from '../ui/Board';
import { useGameEngine } from '../ui/GameEngineContext';
import { Hud } from '../ui/Hud';
import { PauseButton } from '../ui/PauseButton';

/** The match itself: the board, the HUD and a way into the Pause menu. */
export default function GameScreen() {
  const engine = useGameEngine();

  // Every visit to this screen is a new match.
  useEffect(() => {
    engine.startMatch();
    engine.setPaused(false);
  }, [engine]);

  const openPause = useCallback(() => router.push('/pause'), []);

  // Android's back button pauses instead of quitting the match.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          openPause();
          return true;
        }
      );
      return () => subscription.remove();
    }, [openPause])
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.fill}>
        <Board engine={engine} />
        {/* Under the HUD, so the round summary and game-over overlays sit
            on top of it. */}
        <PauseButton onPress={openPause} />
        <Hud engine={engine} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
});
