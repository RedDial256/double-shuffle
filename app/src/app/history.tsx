import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { history } from '../ui/history';
import { ScreenHeader } from '../ui/ScreenHeader';
import { TextPage } from '../ui/TextPage';

/** Where the game comes from: shuffleboard, Hermitcraft and Shuffled to Bits. */
export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader title="History" onBack={() => router.back()} />
      <TextPage sections={history} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
