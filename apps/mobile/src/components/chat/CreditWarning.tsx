import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface CreditWarningProps {
  credits: number;
}

export function CreditWarning({ credits }: CreditWarningProps) {
  const navigation = useNavigation<any>();

  if (credits > 3) return null;

  const isOut = credits <= 0;

  return (
    <View style={[styles.container, isOut ? styles.containerOut : styles.containerLow]}>
      <Text style={[styles.text, isOut ? styles.textOut : styles.textLow]}>
        {isOut
          ? "You're out of credits"
          : `${credits} message${credits === 1 ? '' : 's'} left`}
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Subscription')}
        style={[styles.button, isOut ? styles.buttonOut : styles.buttonLow]}
      >
        <Text style={styles.buttonText}>
          {isOut ? 'Get Credits' : 'Top Up'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  containerLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
  },
  containerOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.2)',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  textLow: {
    color: '#F59E0B',
  },
  textOut: {
    color: '#EF4444',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  buttonLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  buttonOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
