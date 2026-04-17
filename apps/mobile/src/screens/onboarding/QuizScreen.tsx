import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { haptic } from '../../utils/haptics';

const { width } = Dimensions.get('window');

interface QuizProps {
  navigation: any;
}

interface Question {
  title: string;
  subtitle: string;
  options: Array<{
    label: string;
    emoji: string;
    warmthDelta: number;
    playfulnessDelta: number;
  }>;
}

const QUESTIONS: Question[] = [
  {
    title: 'What do you value more\nin a companion?',
    subtitle: 'Choose what feels right',
    options: [
      { label: 'Warmth & Care', emoji: '🤗', warmthDelta: 30, playfulnessDelta: 0 },
      { label: 'Independence & Mystery', emoji: '🌙', warmthDelta: -20, playfulnessDelta: 10 },
    ],
  },
  {
    title: 'How do you like\nyour conversations?',
    subtitle: 'Pick your vibe',
    options: [
      { label: 'Deep & Meaningful', emoji: '💭', warmthDelta: 10, playfulnessDelta: -20 },
      { label: 'Fun & Lighthearted', emoji: '✨', warmthDelta: 0, playfulnessDelta: 30 },
    ],
  },
  {
    title: 'What mood are\nyou in right now?',
    subtitle: 'Be honest',
    options: [
      { label: 'Looking for comfort', emoji: '🌸', warmthDelta: 20, playfulnessDelta: -10 },
      { label: 'Ready for adventure', emoji: '🔥', warmthDelta: -10, playfulnessDelta: 20 },
    ],
  },
];

export function QuizScreen({ navigation }: QuizProps) {
  const [step, setStep] = useState(0);
  const [warmth, setWarmth] = useState(50);
  const [playfulness, setPlayfulness] = useState(50);

  const current = QUESTIONS[step];

  const handleSelect = (option: Question['options'][0]) => {
    haptic.select();
    const newWarmth = Math.max(0, Math.min(100, warmth + option.warmthDelta));
    const newPlayfulness = Math.max(0, Math.min(100, playfulness + option.playfulnessDelta));
    setWarmth(newWarmth);
    setPlayfulness(newPlayfulness);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      haptic.success();
      navigation.navigate('MatchResult', {
        warmth: newWarmth,
        playfulness: newPlayfulness,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        {QUESTIONS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= step ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>

      {/* Skip */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.replace('Main')}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>{current.title}</Text>
        <Text style={styles.questionSubtitle}>{current.subtitle}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {current.options.map((option, i) => (
          <TouchableOpacity
            key={i}
            style={styles.optionCard}
            onPress={() => handleSelect(option)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <Text style={styles.optionLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Step counter */}
      <Text style={styles.stepText}>
        {step + 1} of {QUESTIONS.length}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B1E',
    paddingHorizontal: 24,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: '#8B7FFF',
  },
  progressDotInactive: {
    backgroundColor: '#27272A',
  },
  skipButton: {
    alignSelf: 'flex-end',
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    color: '#71717A',
    fontSize: 14,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
    paddingBottom: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(139, 127, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 127, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#E4E4E7',
  },
  stepText: {
    textAlign: 'center',
    color: '#52525B',
    fontSize: 12,
    paddingBottom: 24,
  },
});
