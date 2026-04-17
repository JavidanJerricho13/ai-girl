import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../services/api.service';
import { CharacterCardSkeleton } from '../../components/LoadingSkeleton';
import { AnimatedCreditBadge } from '../../components/AnimatedCreditBadge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeroCard } from '../../components/discover/HeroCard';
import { BentoCard } from '../../components/discover/BentoCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Character {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  tagline?: string;
  avatar?: string;
  category: string | string[];
  isPublic: boolean;
  isPremium?: boolean;
  messageCount?: number;
  conversationCount?: number;
  media?: Array<{ url: string; type: string }>;
}

const DEBOUNCE_MS = 300;

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LIMIT = 20;
  const categories = ['All', 'Anime', 'Celebrity', 'Game', 'Movie', 'Original'];

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  const fetchCharacters = async (reset: boolean = false) => {
    if (isLoading || isLoadingMore) return;

    const currentOffset = reset ? 0 : offset;

    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params: any = {
        limit: LIMIT,
        offset: currentOffset,
        isPublic: true,
      };

      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await apiService.getCharacters(params);

      if (reset) {
        setCharacters(response.data || response || []);
        setOffset(LIMIT);
      } else {
        const newData = response.data || response || [];
        setCharacters((prev) => [...prev, ...newData]);
        setOffset((prev) => prev + LIMIT);
      }

      const resultData = response.data || response || [];
      setHasMore(Array.isArray(resultData) && resultData.length === LIMIT);
    } catch (error) {
      console.error('Failed to fetch characters:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCharacters(true);
  }, [selectedCategory, debouncedSearch]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setOffset(0);
    fetchCharacters(true);
  }, [selectedCategory, debouncedSearch]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchCharacters(false);
    }
  }, [hasMore, isLoadingMore, isLoading, offset]);

  const handleCharacterPress = (character: Character) => {
    (navigation as any).navigate('CharacterDetail', {
      characterId: character.id,
    });
  };

  const renderCategory = (category: string, index: number) => {
    const isSelected =
      selectedCategory === category ||
      (category === 'All' && !selectedCategory);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.categoryChip,
          isSelected && styles.categoryChipSelected,
        ]}
        onPress={() =>
          setSelectedCategory(category === 'All' ? null : category)
        }
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.categoryTextSelected,
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  const mapCharacter = (item: Character) => ({
    id: item.id,
    displayName: item.displayName || item.name,
    description: item.description || item.tagline || '',
    conversationCount: item.conversationCount || item.messageCount || 0,
    isPremium: item.isPremium,
    media: item.media?.length
      ? item.media
      : item.avatar
        ? [{ url: item.avatar, type: 'profile' }]
        : [],
  });

  const renderCharacterCard = ({ item }: { item: Character }) => (
    <BentoCard
      character={mapCharacter(item)}
      size="small"
      onPress={() => handleCharacterPress(item)}
    />
  );

  const renderHeroHeader = () => {
    if (characters.length === 0) return null;
    const hero = characters[0];
    return (
      <HeroCard
        character={mapCharacter(hero)}
        onPress={() => handleCharacterPress(hero)}
      />
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
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
        <Text style={styles.emptyIcon}>
          {debouncedSearch ? '🔍' : '🧭'}
        </Text>
        <Text style={styles.emptyTitle}>
          {debouncedSearch
            ? `No characters found for "${debouncedSearch}"`
            : 'No Characters Found'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {debouncedSearch
            ? 'Try a different name or category.'
            : 'Try selecting a different category.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B1E' }} edges={['top']}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>
            Find your perfect AI companion
          </Text>
        </View>
        <AnimatedCreditBadge
          onPress={() => (navigation as any).navigate('Subscription')}
        />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search characters..."
            placeholderTextColor="#52525B"
            value={searchInput}
            onChangeText={setSearchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchInput !== '' && (
            <TouchableOpacity
              onPress={() => setSearchInput('')}
              style={styles.clearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item, index }) => renderCategory(item, index)}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Character grid */}
      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          renderItem={() => <CharacterCardSkeleton />}
          keyExtractor={(item) => item.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
        />
      ) : (
        <FlatList
          data={characters}
          renderItem={renderCharacterCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderHeroHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#8B7FFF"
              colors={['#8B7FFF']}
            />
          }
        />
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F5F3FF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#F5F3FF',
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '600',
  },

  // Categories
  categoriesContainer: {
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#8B7FFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },

  // Grid
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: 240,
    marginRight: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#E5E7EB',
    lineHeight: 16,
  },
  messagesBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 127, 255, 0.9)',
  },
  messagesBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F3FF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
  },
});
