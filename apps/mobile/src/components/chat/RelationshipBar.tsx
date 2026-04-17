import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RelationshipBarProps {
  messageCount: number;
}

const LEVELS = [
  { min: 0, max: 10, label: 'Stranger', icon: 'hand-left-outline' as const, color: '#71717A' },
  { min: 10, max: 30, label: 'Acquaintance', icon: 'people-outline' as const, color: '#6366F1' },
  { min: 30, max: 100, label: 'Friend', icon: 'heart-outline' as const, color: '#3B82F6' },
  { min: 100, max: 300, label: 'Close', icon: 'heart' as const, color: '#8B5CF6' },
  { min: 300, max: Infinity, label: 'Intimate', icon: 'heart-circle' as const, color: '#EC4899' },
];

function getLevel(count: number) {
  return LEVELS.find(l => count >= l.min && count < l.max) || LEVELS[LEVELS.length - 1];
}

function getProgress(count: number) {
  const level = getLevel(count);
  if (level.max === Infinity) return 1;
  return Math.min(1, (count - level.min) / (level.max - level.min));
}

export function RelationshipBar({ messageCount }: RelationshipBarProps) {
  const level = getLevel(messageCount);
  const progress = getProgress(messageCount);
  const msgsToNext = level.max === Infinity ? 0 : level.max - messageCount;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name={level.icon} size={12} color={level.color} />
        <Text style={styles.label}>{level.label}</Text>
        {msgsToNext > 0 && (
          <Text style={styles.next}>{msgsToNext} msgs to next</Text>
        )}
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: level.color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  next: {
    fontSize: 10,
    color: '#52525B',
    marginLeft: 'auto',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#27272A',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
});
