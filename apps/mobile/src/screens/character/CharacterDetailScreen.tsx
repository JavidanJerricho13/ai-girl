import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Share,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { ConversationData } from '../../components/ConversationItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_WIDTH * 1.15;

// ─── Types ───────────────────────────────────────────────

interface CharacterMedia {
  id: string;
  type: 'profile' | 'gallery' | 'video_idle' | 'video_speaking';
  url: string;
  thumbnailUrl?: string;
  order: number;
}

interface Character {
  id: string;
  name: string;
  displayName: string;
  description: string;
  shynessBold: number;
  romanticPragmatic: number;
  playfulSerious: number;
  dominantSubmissive: number;
  isPremium: boolean;
  isOfficial: boolean;
  category: string[];
  tags: string[];
  conversationCount: number;
  messageCount: number;
  avgRating: number | null;
  media: CharacterMedia[];
  creator: { id: string; username: string | null; avatar: string | null };
}

interface RouteParams {
  characterId: string;
}

// ─── Helpers ─────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function describeTraits(character: Character): string {
  const traits: Array<[number, string, string]> = [
    [character.shynessBold, 'shy', 'bold'],
    [character.romanticPragmatic, 'romantic', 'pragmatic'],
    [character.playfulSerious, 'playful', 'serious'],
    [character.dominantSubmissive, 'dominant', 'submissive'],
  ];

  const descriptions = traits
    .map(([val, left, right]) => {
      if (val <= 20) return `very ${left}`;
      if (val <= 40) return `somewhat ${left}`;
      if (val <= 60) return null; // balanced, skip
      if (val <= 80) return `somewhat ${right}`;
      return `very ${right}`;
    })
    .filter(Boolean) as string[];

  if (descriptions.length === 0) return 'A well-balanced personality across all traits.';

  const formatted = descriptions.map(
    (d) => d.charAt(0).toUpperCase() + d.slice(1),
  );
  return formatted.join(', ') + '.';
}

// ─── PersonalitySlider ──────────────────────────────────

function PersonalitySlider({
  leftLabel,
  rightLabel,
  value,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
}) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <View style={sliderStyles.container}>
      <Text style={sliderStyles.label}>{leftLabel}</Text>
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.fill, { width: `${pct}%` }]} />
        <View style={[sliderStyles.thumb, { left: `${pct}%` }]} />
      </View>
      <Text style={[sliderStyles.label, { textAlign: 'right' }]}>
        {rightLabel}
      </Text>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    width: 72,
    fontSize: 12,
    color: '#9CA3AF',
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginHorizontal: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#A78BFA',
    borderWidth: 2,
    borderColor: '#1F2937',
    marginLeft: -7,
    top: -4,
  },
});

// ─── StatCard ────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  icon: { fontSize: 18, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  label: { fontSize: 11, color: '#9CA3AF' },
});

// ─── Gallery strip (interactive) ─────────────────────────

function GalleryStrip({
  media,
  selectedId,
  onSelect,
}: {
  media: CharacterMedia[];
  selectedId: string | undefined;
  onSelect: (item: CharacterMedia) => void;
}) {
  const allImages = media
    .filter((m) => m.type === 'profile' || m.type === 'gallery')
    .sort((a, b) => {
      if (a.type === 'profile') return -1;
      if (b.type === 'profile') return 1;
      return a.order - b.order;
    });

  if (allImages.length <= 1) return null;

  return (
    <FlatList
      horizontal
      data={allImages}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 12 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      renderItem={({ item }) => {
        const active = item.id === selectedId;
        return (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            activeOpacity={0.8}
            style={[
              galleryStyles.thumb,
              active && galleryStyles.thumbActive,
            ]}
          >
            <Image
              source={{ uri: item.thumbnailUrl || item.url }}
              style={galleryStyles.thumbImage}
            />
          </TouchableOpacity>
        );
      }}
    />
  );
}

const galleryStyles = StyleSheet.create({
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#8B5CF6',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#374151',
  },
});

// ─── Loading skeleton ────────────────────────────────────

function DetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Hero placeholder */}
      <View style={[styles.heroImage, { backgroundColor: '#1F2937' }]} />

      {/* Gallery strip skeleton */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: '#1F2937' }} />
        ))}
      </View>

      <View style={styles.content}>
        {/* Name */}
        <View style={{ height: 28, width: '60%', backgroundColor: '#1F2937', borderRadius: 8, marginBottom: 16 }} />
        {/* Description lines */}
        <View style={{ height: 14, width: '100%', backgroundColor: '#1F2937', borderRadius: 6, marginBottom: 8 }} />
        <View style={{ height: 14, width: '85%', backgroundColor: '#1F2937', borderRadius: 6, marginBottom: 8 }} />
        <View style={{ height: 14, width: '70%', backgroundColor: '#1F2937', borderRadius: 6, marginBottom: 20 }} />

        {/* Category chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {[80, 60, 70].map((w, i) => (
            <View key={i} style={{ height: 28, width: w, backgroundColor: '#1F2937', borderRadius: 14 }} />
          ))}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, height: 72, backgroundColor: '#1F2937', borderRadius: 12 }} />
          ))}
        </View>

        {/* Personality */}
        <View style={{ height: 16, width: 100, backgroundColor: '#1F2937', borderRadius: 6, marginBottom: 16 }} />
        <View style={{ backgroundColor: '#1F2937', borderRadius: 14, padding: 16, height: 140 }} />
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────

export default function CharacterDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { characterId } = route.params as RouteParams;
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<CharacterMedia | null>(null);

  const {
    data: character,
    isLoading,
    isError,
    refetch,
  } = useQuery<Character>({
    queryKey: ['character', characterId],
    queryFn: () => apiService.getCharacter(characterId),
  });

  const handleStartChat = useCallback(async () => {
    if (!character || isStarting) return;
    setIsStarting(true);

    try {
      const conversations: ConversationData[] =
        queryClient.getQueryData(['conversations']) ??
        (await apiService.getConversations());

      const existing = conversations.find(
        (c) => c.character.id === character.id,
      );

      const profileUrl = character.media.find((m) => m.type === 'profile')?.url;

      if (existing) {
        (navigation as any).navigate('Chat', {
          conversationId: existing.id,
          characterId: character.id,
          characterName: character.displayName || character.name,
          characterAvatar: profileUrl,
        });
      } else {
        const newConversation = await apiService.createConversation({
          characterId: character.id,
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        (navigation as any).navigate('Chat', {
          conversationId: newConversation.id,
          characterId: character.id,
          characterName: character.displayName || character.name,
          characterAvatar: profileUrl,
        });
      }
    } catch {
      Alert.alert('Error', 'Could not start a conversation. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }, [character, isStarting, navigation, queryClient]);

  const handleVideoCall = useCallback(() => {
    Alert.alert('Coming Soon', 'Video calls will be available soon.');
  }, []);

  const handleShare = useCallback(async () => {
    if (!character) return;
    try {
      await Share.share({
        message: `Check out ${character.displayName || character.name} on Ethereal!`,
      });
    } catch {
      // user cancelled
    }
  }, [character]);

  // ── Loading ──
  if (isLoading) return <DetailSkeleton />;

  // ── Error ──
  if (isError || !character) {
    return (
      <View style={styles.centered}>
        <TouchableOpacity
          style={[styles.backButton, { top: 50 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.errorIconText}>!</Text>
        <Text style={styles.errorTitle}>Character not found</Text>
        <Text style={styles.errorSubtitle}>
          This character may have been removed or is unavailable.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: '#8B5CF6' }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const profileImage = character.media.find((m) => m.type === 'profile');
  const heroImage = selectedMedia || profileImage;

  return (
    <View style={styles.container}>
      {/* Floating header buttons */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        {heroImage ? (
          <Image
            source={{ uri: heroImage.url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={styles.heroInitial}>
              {(character.displayName || character.name).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Interactive gallery strip */}
        <GalleryStrip
          media={character.media}
          selectedId={heroImage?.id}
          onSelect={setSelectedMedia}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Name + badges */}
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>
              {character.displayName || character.name}
            </Text>
            {character.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>★ Premium</Text>
              </View>
            )}
            {character.isOfficial && (
              <View style={styles.officialBadge}>
                <Text style={styles.officialText}>✓ Official</Text>
              </View>
            )}
          </View>

          {/* Creator */}
          {character.creator?.username && (
            <Text style={styles.creatorText}>
              by @{character.creator.username}
            </Text>
          )}

          {/* Description */}
          <Text style={styles.description}>{character.description}</Text>

          {/* Categories */}
          {character.category.length > 0 && (
            <View style={styles.chipRow}>
              {character.category.map((cat) => (
                <View key={cat} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{cat}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
          {character.tags.length > 0 && (
            <View style={styles.chipRow}>
              {character.tags.map((tag) => (
                <Text key={tag} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard
              icon="💬"
              value={formatCount(character.conversationCount)}
              label="Chats"
            />
            <StatCard
              icon="✉️"
              value={formatCount(character.messageCount)}
              label="Messages"
            />
            <StatCard
              icon="⭐"
              value={
                character.avgRating != null
                  ? character.avgRating.toFixed(1)
                  : '—'
              }
              label="Rating"
            />
          </View>

          {/* Personality */}
          <Text style={styles.sectionTitle}>Personality</Text>
          <View style={styles.personalityCard}>
            <PersonalitySlider
              leftLabel="Shy"
              rightLabel="Bold"
              value={character.shynessBold}
            />
            <PersonalitySlider
              leftLabel="Romantic"
              rightLabel="Pragmatic"
              value={character.romanticPragmatic}
            />
            <PersonalitySlider
              leftLabel="Playful"
              rightLabel="Serious"
              value={character.playfulSerious}
            />
            <PersonalitySlider
              leftLabel="Dominant"
              rightLabel="Submissive"
              value={character.dominantSubmissive}
            />
            <View style={styles.previewDivider} />
            <Text style={styles.previewText}>
              {describeTraits(character)}
            </Text>
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartChat}
            activeOpacity={0.8}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>💬  Start Chatting</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleVideoCall}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>📹  Video Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 40,
  },

  // Floating header
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  shareIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },

  // Hero
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: '#1F2937',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  heroInitial: {
    fontSize: 72,
    fontWeight: '700',
    color: '#6B7280',
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#92400E',
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCD34D',
  },
  officialBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  officialText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
  },
  creatorText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#9CA3AF',
    marginBottom: 16,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C4B5FD',
    textTransform: 'capitalize',
  },
  tag: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginVertical: 16,
  },

  // Personality
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginTop: 8,
  },
  personalityCard: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginTop: 4,
    marginBottom: 10,
  },
  previewText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6B7280',
    lineHeight: 18,
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D1D5DB',
  },

  // Error
  errorIconText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: '#7F1D1D',
    width: 60,
    height: 60,
    lineHeight: 60,
    textAlign: 'center',
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
