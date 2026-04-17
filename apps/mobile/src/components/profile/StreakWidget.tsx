import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakWidgetProps {
  currentStreak: number;
  lastStreakDate?: string | null;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MILESTONES = [
  { day: 3, bonus: 10 },
  { day: 7, bonus: 25 },
  { day: 14, bonus: 50 },
  { day: 30, bonus: 100 },
];

export function StreakWidget({ currentStreak, lastStreakDate }: StreakWidgetProps) {
  const today = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = today === 0 ? 6 : today - 1;

  // Calculate which days this week have been "active"
  const activeDays = Math.min(currentStreak, 7);

  const nextMilestone = MILESTONES.find(m => m.day > currentStreak);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakCount}>Day {currentStreak}</Text>
        <Text style={styles.streakLabel}>Streak</Text>
      </View>

      {/* Week dots */}
      <View style={styles.weekRow}>
        {DAYS.map((day, i) => {
          const isActive = i <= mondayOffset && i >= mondayOffset - activeDays + 1;
          const isToday = i === mondayOffset;

          return (
            <View key={day} style={styles.dayCol}>
              <View
                style={[
                  styles.dayDot,
                  isActive ? styles.dayDotActive : styles.dayDotInactive,
                  isToday && styles.dayDotToday,
                ]}
              />
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Next milestone */}
      {nextMilestone && (
        <View style={styles.milestone}>
          <Text style={styles.milestoneText}>
            Day {nextMilestone.day} bonus: +{nextMilestone.bonus} credits
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (currentStreak / nextMilestone.day) * 100)}%` },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(139, 127, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139, 127, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 14,
    color: '#71717A',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotActive: {
    backgroundColor: '#8B7FFF',
  },
  dayDotInactive: {
    backgroundColor: '#27272A',
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dayLabel: {
    fontSize: 10,
    color: '#52525B',
  },
  dayLabelToday: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  milestone: {
    gap: 6,
  },
  milestoneText: {
    fontSize: 11,
    color: '#8B7FFF',
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#27272A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B7FFF',
    borderRadius: 2,
  },
});
