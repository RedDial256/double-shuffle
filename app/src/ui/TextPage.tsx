import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, textVariants } from '../theme';

export interface TextPageSection {
  id: string;
  title: string;
  paragraphs: readonly string[];
}

/**
 * A scrolling page of titled sections, styled with the design tokens: the
 * rulebook and the History page. The book-style look comes in M4.
 */
export function TextPage({
  sections,
}: {
  sections: readonly TextPageSection[];
}) {
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
