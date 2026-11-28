import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { GameMode } from '../game/mode';
import { colors, spacing, textVariants } from '../theme';

import { rulebook } from './rulebook';

/**
 * The rulebook text, styled with the design tokens. The Rules route wraps it
 * in a screen; the book-style look comes in M4.
 */
export function RulesBody({
  mode,
}: {
  /** Rules of the current match; the text quotes its numbers. */
  mode: Readonly<GameMode>;
}) {
  const sections = useMemo(() => rulebook(mode), [mode]);

  return (
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
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: spacing['3xl'], gap: spacing.lg },
  section: { gap: spacing.xs },
  heading: { ...textVariants.heading, color: colors.accent },
  paragraph: { ...textVariants.body, color: colors.text.primary },
});
