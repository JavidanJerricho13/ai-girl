import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../services/api.service';
import { haptic } from '../../utils/haptics';

interface MatchCharacter {
  id: string;
  name: string;
  displayName: string;
  description: string;
  avatarUrl: string | null;
  matchScore: number;
  warmth: number;
  playfulness: number;
}

interface MatchResultProps {
  navigation: any;
  route: {
    params: {
      warmth: number;
      playfulness: number;
    };
  };
}

export function MatchResultScreen({ navigation, route }: MatchResultProps) {
  const { warmth, playfulness } = route.params;
  const [matches, setMatches] = useState<MatchCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.matchCharacters(warmth, playfulness);
        setMatches(data);
        haptic.success();
      } catch (err) {
        Alert.alert('Error', 'Failed to find matches');
      } finally {
        setLoading(false);
      }
    })();
  }, [warmth, playfulness]);

  const handleStartChat = async (character: MatchCharacter) => {
    setStarting(true);
    haptic.light();
    try {
      const conversation = await apiService.createConversation(character.id);
      navigation.replace('Main', {
        screen: 'Chat',
        params: {
          conversationId: conversation.id,
          characterId: character.id,
          characterName: character.displayName,
          characterAvatar: character.avatarUrl,
        },
      });
    } catch {
      Alert.alert('Error', 'Failed to start chat');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B7FFF" />
          <Text style={styles.loadingText}>Finding your perfect match...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const topMatch = matches[0];
  const otherMatches = matches.slice(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.headerLabel}>We found your match</Text>

        {/* Top match card */}
        {topMatch && (
          <View style={styles.topCard}>
            <View style={styles.avatarContainer}>
              {topMatch.avatarUrl ? (
                <Image
                  source={topMatch.avatarUrl}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarLetter}>
                    {topMatch.displayName.charAt(0)}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.matchScore}>{topMatch.matchScore}% match</Text>
            <Text style={styles.characterName}>{topMatch.displayName}</Text>
            <Text style={styles.characterDesc} numberOfLines={2}>
              {topMatch.description}
            </Text>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleStartChat(topMatch)}
              disabled={starting}
              activeOpacity={0.8}
            >
              {starting ? (
                <ActivityIndicator color="#0A0B1E" size="small" />
              ) : (
                <Text style={styles.startButtonText}>Start Chatting</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Other matches */}
        {otherMatches.length > 0 && (
          <View style={styles.othersSection}>
            <Text style={styles.othersLabel}>Other matches</Text>
            <View style={styles.othersRow}>
              {otherMatches.map((char) => (
                <TouchableOpacity
                  key={char.id}
                  style={styles.otherCard}
                  onPress={() => handleStartChat(char)}
                  activeOpacity={0.8}
                >
                  {char.avatarUrl ? (
                    <Image
                      source={char.avatarUrl}
                      style={styles.otherAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.otherAvatar, styles.avatarPlaceholder]}>
                      <Text style={styles.otherLetter}>
                        {char.displayName.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.otherName} numberOfLines={1}>
                    {char.displayName}
                  </Text>
                  <Text style={styles.otherScore}>{char.matchScore}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Skip */}
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.replace('Main')}
      >
        <Text style={styles.browseText}>Browse all characters →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B1E',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#71717A',
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 14,
    color: '#8B7FFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 24,
  },
  topCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(139, 127, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139, 127, 255, 0.12)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1A1033',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '600',
    color: '#8B7FFF',
  },
  matchScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B7FFF',
    backgroundColor: 'rgba(139, 127, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  characterName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  characterDesc: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#8B7FFF',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#0A0B1E',
    fontSize: 16,
    fontWeight: '600',
  },
  othersSection: {
    marginTop: 32,
  },
  othersLabel: {
    fontSize: 12,
    color: '#52525B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  othersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  otherCard: {
    alignItems: 'center',
    width: 80,
  },
  otherAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 6,
  },
  otherLetter: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B7FFF',
  },
  otherName: {
    fontSize: 12,
    color: '#D4D4D8',
    marginBottom: 2,
  },
  otherScore: {
    fontSize: 11,
    color: '#8B7FFF',
    fontWeight: '500',
  },
  browseButton: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  browseText: {
    color: '#71717A',
    fontSize: 14,
  },
});
