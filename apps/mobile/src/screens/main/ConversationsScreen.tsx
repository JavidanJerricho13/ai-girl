import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ConversationItem,
  ConversationData,
} from '../../components/ConversationItem';
import { ConversationItemSkeleton } from '../../components/LoadingSkeleton';

export default function ConversationsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: conversations,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<ConversationData[]>({
    queryKey: ['conversations'],
    queryFn: () => apiService.getConversations(),
  });

  // Refetch when the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }, [queryClient]),
  );

  const filtered = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;

    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = (c.character.displayName || c.character.name).toLowerCase();
      return name.includes(q);
    });
  }, [conversations, searchQuery]);

  const handlePress = useCallback(
    (conversation: ConversationData) => {
      const avatarUrl = conversation.character.media?.[0]?.url;
      (navigation as any).navigate('Chat', {
        conversationId: conversation.id,
        characterId: conversation.character.id,
        characterName:
          conversation.character.displayName || conversation.character.name,
        characterAvatar: avatarUrl,
      });
    },
    [navigation],
  );

  const handleDiscoverPress = useCallback(() => {
    (navigation as any).navigate('MainTabs', { screen: 'Discover' });
  }, [navigation]);

  // --- Loading state ---
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B1E' }} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={() => <ConversationItemSkeleton />}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.listContent}
        />
      </View>
      </SafeAreaView>
    );
  }

  // --- Error state ---
  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B1E' }} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>
            Could not load your conversations.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B1E' }} edges={['top']}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {/* Search bar */}
      {conversations && conversations.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by character name..."
            placeholderTextColor="#52525B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery !== '' && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem conversation={item} onPress={handlePress} />
        )}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyListContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#8B7FFF"
            colors={['#8B7FFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' : 'No chats yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No conversations match "${searchQuery}"`
                : 'Discover characters and start chatting!'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.discoverButton}
                onPress={handleDiscoverPress}
                activeOpacity={0.7}
              >
                <Text style={styles.discoverButtonText}>
                  Discover Characters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#F5F3FF',
  },
  clearButton: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
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
  errorIcon: {
    fontSize: 36,
    color: '#EF4444',
    fontWeight: '700',
    marginBottom: 16,
    width: 60,
    height: 60,
    lineHeight: 60,
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 30,
    overflow: 'hidden',
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
    lineHeight: 20,
    marginBottom: 24,
  },
  discoverButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8B7FFF',
  },
  discoverButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
