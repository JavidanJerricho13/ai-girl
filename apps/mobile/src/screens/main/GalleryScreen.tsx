import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { ImageViewer, ImageViewerData } from '../../components/media/ImageViewer';
import { GalleryCard as GalleryCardComponent } from '../../components/media/GalleryCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_WIDTH - 48) / 2;
const LIMIT = 20;

// ── Types ────────────────────────────────────────────────

interface GalleryItem {
  id: string;
  type: string;
  prompt: string | null;
  resultUrl: string | null;
  characterId: string | null;
  status: string;
  createdAt: string;
}

type TabFilter = 'All' | 'Images' | 'Audio';

const TABS: TabFilter[] = ['All', 'Images', 'Audio'];

// ── Helpers ──────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── GalleryCard ──────────────────────────────────────────

function GalleryCard({
  item,
  onPress,
}: {
  item: GalleryItem;
  onPress: (item: GalleryItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const isImage = item.type === 'image';

  if (!item.resultUrl) return null;

  if (!isImage) {
    // Voice card
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.voiceCard}>
          <View style={styles.voiceIconCircle}>
            <Text style={styles.voiceIcon}>🔊</Text>
          </View>
          <Text style={styles.voiceLabel}>Voice</Text>
          {item.prompt && (
            <Text style={styles.voicePrompt} numberOfLines={2}>
              {item.prompt}
            </Text>
          )}
          <Text style={styles.voiceDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.9}
    >
      {!loaded && <View style={styles.imageSkeleton} />}
      <Image
        source={{ uri: item.resultUrl }}
        style={[styles.cardImage, !loaded && { position: 'absolute', opacity: 0 }]}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
      />
      {loaded && (
        <View style={styles.imageOverlay}>
          <Text style={styles.imageDate}>{formatDate(item.createdAt)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── MediaDetail Modal ────────────────────────────────────

function MediaDetailModal({
  item,
  visible,
  onClose,
}: {
  item: GalleryItem | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!item) return null;

  const isImage = item.type === 'image';

  const handleShare = async () => {
    if (!item.resultUrl) return;
    try {
      await Share.share({
        message: item.prompt
          ? `Check out this ${item.type} I generated: ${item.prompt}`
          : `Check out this generated ${item.type}!`,
        url: item.resultUrl,
      });
    } catch {
      // cancelled
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={detailStyles.container}>
        {/* Header */}
        <View style={detailStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={detailStyles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={detailStyles.headerTitle}>
            {isImage ? 'Image' : 'Voice'}
          </Text>
          <TouchableOpacity onPress={handleShare}>
            <Text style={detailStyles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={detailStyles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Media */}
          {isImage && item.resultUrl ? (
            <Image
              source={{ uri: item.resultUrl }}
              style={detailStyles.image}
              resizeMode="contain"
            />
          ) : item.resultUrl ? (
            <View style={detailStyles.audioContainer}>
              <View style={detailStyles.audioIconCircle}>
                <Text style={detailStyles.audioIcon}>🔊</Text>
              </View>
              <Text style={detailStyles.audioLabel}>Generated Voice</Text>
            </View>
          ) : null}

          {/* Metadata */}
          <View style={detailStyles.meta}>
            {item.prompt && (
              <View style={detailStyles.metaSection}>
                <Text style={detailStyles.metaLabel}>Prompt</Text>
                <View style={detailStyles.promptBox}>
                  <Text style={detailStyles.promptText}>{item.prompt}</Text>
                </View>
              </View>
            )}

            <View style={detailStyles.metaSection}>
              <Text style={detailStyles.metaLabel}>Type</Text>
              <View
                style={[
                  detailStyles.typeBadge,
                  isImage
                    ? detailStyles.typeBadgeImage
                    : detailStyles.typeBadgeVoice,
                ]}
              >
                <Text
                  style={[
                    detailStyles.typeBadgeText,
                    isImage
                      ? detailStyles.typeBadgeTextImage
                      : detailStyles.typeBadgeTextVoice,
                  ]}
                >
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
            </View>

            <View style={detailStyles.metaSection}>
              <Text style={detailStyles.metaLabel}>Created</Text>
              <Text style={detailStyles.metaValue}>
                {formatFullDate(item.createdAt)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  closeText: {
    fontSize: 16,
    color: '#8B7FFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareText: {
    fontSize: 16,
    color: '#8B7FFF',
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: SCREEN_WIDTH,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    marginBottom: 20,
  },
  audioContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  audioIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioIcon: {
    fontSize: 36,
  },
  audioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  meta: {
    gap: 20,
  },
  metaSection: {
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptBox: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  promptText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  metaValue: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeImage: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  typeBadgeVoice: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadgeTextImage: {
    color: '#10B981',
  },
  typeBadgeTextVoice: {
    color: '#F59E0B',
  },
});

// ── Main Screen ──────────────────────────────────────────

export default function GalleryScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [imageViewerData, setImageViewerData] = useState<ImageViewerData | null>(null);

  const handleItemPress = useCallback((item: GalleryItem) => {
    if (item.type === 'image' && item.resultUrl) {
      setImageViewerData({
        uri: item.resultUrl,
        prompt: item.prompt ?? undefined,
        date: item.createdAt,
      });
    } else {
      setSelectedItem(item);
    }
  }, []);

  const typeFilter =
    activeTab === 'Images' ? 'image' : activeTab === 'Audio' ? 'voice' : undefined;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['gallery', activeTab],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await apiService.getGenerationHistory({
        limit: LIMIT,
        offset: pageParam,
      });
      const items: GalleryItem[] = result?.data ?? result ?? [];
      if (typeFilter) {
        return items.filter((i: GalleryItem) => i.type === typeFilter);
      }
      return items;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < LIMIT) return undefined;
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
  });

  const items =
    data?.pages
      .flat()
      .filter((i) => i.resultUrl && i.status === 'COMPLETED') ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: GalleryItem }) => (
      <GalleryCardComponent
        item={{
          id: item.id,
          type: item.type,
          resultUrl: item.resultUrl,
          prompt: item.prompt,
          createdAt: item.createdAt,
        }}
        onPress={() => handleItemPress(item)}
      />
    ),
    [handleItemPress],
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#8B7FFF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>🖼️</Text>
        </View>
        <Text style={styles.emptyTitle}>No media yet</Text>
        <Text style={styles.emptySubtitle}>
          Generate images or voice in chat to see them here!
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() =>
            (navigation as any).navigate('MainTabs', { screen: 'Discover' })
          }
          activeOpacity={0.7}
        >
          <Text style={styles.ctaButtonText}>Discover Characters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(item) => item.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={() => <View style={styles.skeleton} />}
        />
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Failed to load gallery</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={
            items.length === 0 ? styles.emptyList : styles.grid
          }
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="#8B7FFF"
              colors={['#8B7FFF']}
            />
          }
        />
      )}

      {/* Voice detail modal */}
      <MediaDetailModal
        item={selectedItem}
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Image viewer with gestures */}
      <ImageViewer
        data={imageViewerData}
        visible={!!imageViewerData}
        onClose={() => setImageViewerData(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B1E',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F5F3FF',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
  },
  tabActive: {
    backgroundColor: '#8B7FFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Grid
  grid: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    width: CARD_SIZE,
    marginRight: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: CARD_SIZE,
    height: CARD_SIZE,
  },
  imageSkeleton: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#1F2937',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  imageDate: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Voice card
  voiceCard: {
    padding: 16,
    alignItems: 'center',
    height: CARD_SIZE,
    justifyContent: 'center',
  },
  voiceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceIcon: {
    fontSize: 22,
  },
  voiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F3FF',
    marginBottom: 4,
  },
  voicePrompt: {
    fontSize: 12,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
  voiceDate: {
    fontSize: 11,
    color: '#52525B',
  },

  // Skeleton
  skeleton: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    marginRight: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1F2937',
  },

  // Footer
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F3FF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8B7FFF',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    width: 56,
    height: 56,
    lineHeight: 56,
    textAlign: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F3FF',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
