import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rulebook } from './rulebook';

/**
 * The Rules screen: a full-screen sheet over the game. Plain styling for now;
 * the book-style look comes in M4.
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
          {sections.map((s) => (
            <View key={s.id} style={styles.section}>
              <Text style={styles.heading} accessibilityRole="header">
                {s.title}
              </Text>
              {s.paragraphs.map((p, i) => (
                <Text key={i} style={styles.paragraph}>
                  {p}
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
  root: { flex: 1, backgroundColor: '#14171f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2f3a',
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  close: {
    backgroundColor: '#35c9c4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeText: { fontWeight: '800', fontSize: 14 },
  body: { padding: 16, paddingBottom: 32, gap: 20 },
  section: { gap: 8 },
  heading: { color: '#35c9c4', fontSize: 18, fontWeight: '800' },
  paragraph: { color: '#e6e8ee', fontSize: 16, lineHeight: 23 },
  openButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#000a',
    borderWidth: 1,
    borderColor: '#35c9c4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
