import { useCallback, useEffect, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { isAppInForeground } from '../ui/appState';
import { Board } from '../ui/Board';
import { useGameEngine } from '../ui/GameEngineContext';
import { Hud } from '../ui/Hud';
import { useMatchSetup } from '../ui/matchSetup';
import { ThrowPanel } from '../ui/ThrowPanel';

/** The match itself: the board, the HUD and a way into the Pause menu. */
export default function GameScreen() {
  const engine = useGameEngine();
  const { selectedMode } = useMatchSetup();

  // Every visit to this screen is a new match, with the mode picked before
  // it. Changing the mode mid-match (not possible today) must not restart.
  const [startMode] = useState(selectedMode);
  useEffect(() => {
    engine.startMatch(startMode);
    engine.setPaused(false);
  }, [engine, startMode]);

  const openPause = useCallback(() => router.push('/pause'), []);

  // Leaving the app (home button, app switcher, a call) pauses the match at
  // once and shows the Pause menu on return, so a sliding cube waits.
  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', (appState) => {
        if (isAppInForeground(appState)) return;
        engine.setPaused(true);
        openPause();
      });
      return () => subscription.remove();
    }, [engine, openPause])
  );

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
      <Hud
        engine={engine}
        board={
          <View style={styles.fill}>
            <View style={styles.board}>
              <Board engine={engine} />
            </View>
            <View style={styles.throwPanel}>
              <ThrowPanel engine={engine} />
            </View>
          </View>
        }
        onPause={openPause}
        onQuitToHome={() => router.dismissTo('/')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  // The board takes about 70% under the score band, the throw panel the rest
  // (docs/decisions.md D-30).
  board: { flex: 7 },
  throwPanel: { flex: 3 },
});
