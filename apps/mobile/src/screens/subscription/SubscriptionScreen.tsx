import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { revenueCatService, CreditPackage } from '../../services/revenuecat.service';
import { useAuthStore } from '../../store/auth.store';
import { apiService } from '../../services/api.service';

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { user, updateCredits } = useAuthStore();
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState(user?.credits || 0);

  useEffect(() => {
    initializeRevenueCat();
    loadCredits();
  }, []);

  const initializeRevenueCat = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      await revenueCatService.initialize(user.id);
      await loadPackages();
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      Alert.alert('Error', 'Failed to load subscription packages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const offerings = await revenueCatService.getOfferings();
      
      // Sort packages by credits (ascending)
      const sortedPackages = offerings.sort((a, b) => a.credits - b.credits);
      setPackages(sortedPackages);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const loadCredits = async () => {
    try {
      const response = await apiService.getCredits();
      setCurrentCredits(response.credits);
      updateCredits(response.credits);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadPackages(), loadCredits()]);
    setIsRefreshing(false);
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to purchase credits');
      return;
    }

    setIsPurchasing(pkg.id);

    try {
      const result = await revenueCatService.purchasePackage(pkg.package);

      if (result.success) {
        // Notify backend about the purchase
        try {
          // The backend will verify the purchase with RevenueCat webhook
          await apiService.getCredits();
          await loadCredits();
          
          Alert.alert(
            'Purchase Successful! 🎉',
            `You've received ${pkg.credits} credits!`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } catch (error) {
          console.error('Failed to sync purchase with backend:', error);
          Alert.alert(
            'Purchase Completed',
            'Your purchase is being processed. Credits will be added shortly.'
          );
        }
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Failed',
        error?.message || 'Unable to complete purchase. Please try again.'
      );
    } finally {
      setIsPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      await revenueCatService.restorePurchases();
      await loadCredits();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPackageCard = (pkg: CreditPackage, index: number) => {
    const isPopular = index === 1; // Mark middle package as popular
    const isPurchasingThis = isPurchasing === pkg.id;

    return (
      <TouchableOpacity
        key={pkg.id}
        style={[
          styles.packageCard,
          isPopular && styles.packageCardPopular,
          isPurchasingThis && styles.packageCardPurchasing,
        ]}
        onPress={() => handlePurchase(pkg)}
        disabled={isPurchasingThis}
        activeOpacity={0.8}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>🔥 MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.packageHeader}>
          <Text style={styles.packageCredits}>{pkg.credits.toLocaleString()}</Text>
          <Text style={styles.packageCreditsLabel}>Credits</Text>
        </View>

        <View style={styles.packageDivider} />

        <View style={styles.packageBody}>
          <Text style={styles.packagePrice}>{pkg.priceString}</Text>
          <Text style={styles.packagePricePerCredit}>
            ${(parseFloat(pkg.price) / pkg.credits).toFixed(3)} per credit
          </Text>
        </View>

        <View style={styles.packageFeatures}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Chat with AI characters</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Generate images</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Voice messages</Text>
          </View>
          {pkg.credits >= 500 && (
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Video calls</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            isPopular && styles.purchaseButtonPopular,
            isPurchasingThis && styles.purchaseButtonPurchasing,
          ]}
          onPress={() => handlePurchase(pkg)}
          disabled={isPurchasingThis}
        >
          {isPurchasingThis ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.purchaseButtonText}>Purchase</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading packages...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#8B5CF6"
          colors={['#8B5CF6']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Get More Credits</Text>
        <Text style={styles.subtitle}>
          Choose a package to continue your AI experience
        </Text>
        
        <View style={styles.currentCreditsCard}>
          <Text style={styles.currentCreditsLabel}>Current Balance</Text>
          <Text style={styles.currentCreditsAmount}>
            {currentCredits.toLocaleString()} credits
          </Text>
        </View>
      </View>

      <View style={styles.packagesGrid}>
        {packages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No packages available at the moment
            </Text>
          </View>
        ) : (
          packages.map((pkg, index) => renderPackageCard(pkg, index))
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Credits are non-refundable and don't expire. By purchasing, you agree to our Terms of Service.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  currentCreditsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentCreditsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  currentCreditsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  packagesGrid: {
    gap: 16,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  packageCardPopular: {
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.2,
    transform: [{ scale: 1.02 }],
  },
  packageCardPurchasing: {
    opacity: 0.6,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  packageCredits: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  packageCreditsLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  packageDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  packageBody: {
    alignItems: 'center',
    marginBottom: 20,
  },
  packagePrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  packagePricePerCredit: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  packageFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 16,
    color: '#10B981',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
  },
  purchaseButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonPopular: {
    backgroundColor: '#7C3AED',
  },
  purchaseButtonPurchasing: {
    backgroundColor: '#C4B5FD',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  footerNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
