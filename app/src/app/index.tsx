import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, textVariants } from '../theme';
import { MenuButton } from '../ui/MenuButton';

/** Home: the first screen, where a match starts. */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.titleBlock}>
        <Text style={styles.title} accessibilityRole="header">
          Double Shuffle
        </Text>
        <Text style={styles.tagline}>Shuffleboard on ice, for two.</Text>
      </View>
      <View style={styles.menu}>
        <MenuButton
          label="Play"
          variant="primary"
          onPress={() => router.push('/game')}
        />
        <MenuButton label="Rules" onPress={() => router.push('/rules')} />
        <MenuButton label="Settings" onPress={() => router.push('/settings')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
    gap: spacing['5xl'],
  },
  titleBlock: { alignItems: 'center', gap: spacing.xs },
  title: { ...textVariants.display, color: colors.text.primary },
  tagline: { ...textVariants.body, color: colors.text.secondary },
  menu: { gap: spacing.sm },
});
