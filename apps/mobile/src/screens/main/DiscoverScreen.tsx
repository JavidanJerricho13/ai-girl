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

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Character {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  category: string;
  isPublic: boolean;
  messageCount?: number;
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

  const renderCharacterCard = ({ item }: { item: Character }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleCharacterPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/200' }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardOverlay}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {item.tagline}
          </Text>
          {item.messageCount !== undefined && item.messageCount > 0 && (
            <View style={styles.messagesBadge}>
              <Text style={styles.messagesBadgeText}>
                {item.messageCount}+ chats
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#8B5CF6" />
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
            placeholderTextColor="#9CA3AF"
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
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
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
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },

  // Categories
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#8B5CF6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },

  // Grid
  gridContainer: {
    padding: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: 240,
    marginRight: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
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
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
