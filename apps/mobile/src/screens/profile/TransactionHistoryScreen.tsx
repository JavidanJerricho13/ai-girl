import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../services/api.service';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TransactionRow({ item }: { item: Transaction }) {
  const isPositive = item.amount > 0;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconCircle,
          isPositive ? styles.iconCircleGreen : styles.iconCircleRed,
        ]}
      >
        <Text style={styles.iconText}>{isPositive ? '↑' : '↓'}</Text>
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.rowRight}>
        <Text
          style={[
            styles.rowAmount,
            isPositive ? styles.amountGreen : styles.amountRed,
          ]}
        >
          {isPositive ? '+' : ''}
          {item.amount}
        </Text>
        <Text style={styles.rowBalance}>
          bal: {item.balance.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function TransactionHistoryScreen() {
  const {
    data: transactions,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => apiService.getTransactions({ limit: 50 }),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B1E' }} edges={['top']}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B7FFF" />
      </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B1E' }} edges={['top']}>
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={styles.errorTitle}>Failed to load transactions</Text>
        <Text
          style={styles.retryText}
          onPress={() => refetch()}
        >
          Tap to retry
        </Text>
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B1E' }} edges={['top']}>
    <View style={styles.container}>
      <FlatList
        data={transactions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow item={item} />}
        contentContainerStyle={
          !transactions?.length ? styles.emptyList : styles.list
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>
              Your credit activity will appear here.
            </Text>
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
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0B1E',
    padding: 40,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#111827',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleGreen: {
    backgroundColor: '#D1FAE5',
  },
  iconCircleRed: {
    backgroundColor: '#FEE2E2',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F5F3FF',
    marginBottom: 2,
  },
  rowDate: {
    fontSize: 13,
    color: '#52525B',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  amountGreen: {
    color: '#10B981',
  },
  amountRed: {
    color: '#EF4444',
  },
  rowBalance: {
    fontSize: 12,
    color: '#52525B',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  },

  // Error
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
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7FFF',
  },
});
