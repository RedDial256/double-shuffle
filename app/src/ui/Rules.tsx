import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, textVariants } from '../theme';

import { rulebook } from './rulebook';

/**
 * The Rules screen: a full-screen sheet over the game, styled with the design
 * tokens. The book-style look comes in M4.
 */
export function RulesScreen({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const sections = useMemo(() => rulebook(), []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Rules
          </Text>
          <Pressable
            onPress={onClose}
            style={styles.close}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close the rules and go back to the game">
            <Text style={styles.closeText}>Back to game</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={styles.heading} accessibilityRole="header">
                {section.title}
              </Text>
              {section.paragraphs.map((paragraph, index) => (
                <Text key={index} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/** Small button that opens the Rules screen from the game. */
export function RulesButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.openButton}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open the rules">
      <Text style={styles.openButtonText}>Rules</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  title: { ...textVariants.title, color: colors.text.primary },
  close: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  closeText: { ...textVariants.label, color: colors.text.onAccent },
  body: { padding: spacing.md, paddingBottom: spacing['3xl'], gap: spacing.lg },
  section: { gap: spacing.xs },
  heading: { ...textVariants.heading, color: colors.accent },
  paragraph: { ...textVariants.body, color: colors.text.primary },
  openButton: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.scrim,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  openButtonText: { ...textVariants.label, color: colors.text.primary },
});
