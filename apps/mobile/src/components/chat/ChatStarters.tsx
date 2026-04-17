import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { haptic } from '../../utils/haptics';

interface ChatStartersProps {
  onSelect: (text: string) => void;
  characterName?: string;
}

const STARTERS = [
  'Tell me about yourself',
  'What are you thinking about?',
  'Send me a photo',
  'How was your day?',
  'Tell me something interesting',
  'What makes you happy?',
];

export function ChatStarters({ onSelect, characterName }: ChatStartersProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Start a conversation with {characterName || 'them'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STARTERS.map((starter) => (
          <TouchableOpacity
            key={starter}
            style={styles.chip}
            onPress={() => {
              haptic.light();
              onSelect(starter);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{starter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  label: {
    fontSize: 11,
    color: '#52525B',
    textAlign: 'center',
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(139, 127, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 127, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
});
