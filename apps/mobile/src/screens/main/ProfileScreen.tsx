import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useAuthStore } from '../../store/auth.store';
import { apiService } from '../../services/api.service';
import { AnimatedCreditBadge } from '../../components/AnimatedCreditBadge';
import { StreakWidget } from '../../components/profile/StreakWidget';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout, updateCredits } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const response = await apiService.getCredits();
      updateCredits(response.credits);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCredits();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Profile</Text>
        <Text style={styles.emptySubtitle}>Please log in</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#8B7FFF"
          colors={['#8B7FFF']}
        />
      }
    >
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user.email.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>
          {user.username || user.email.split('@')[0]}
        </Text>
        <Text style={styles.email}>{user.email}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} style={styles.creditsCard}>
        <View style={styles.creditsHeader}>
          <Text style={styles.creditsTitle}>Your Credits</Text>
          <AnimatedCreditBadge />
        </View>
        <View style={styles.creditsDivider} />
        <TouchableOpacity
          style={styles.buyCreditsButton}
          onPress={() => (navigation as any).navigate('Subscription')}
          activeOpacity={0.8}
        >
          <Text style={styles.buyCreditsIcon}>💎</Text>
          <Text style={styles.buyCreditsText}>Get More Credits</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250)}>
        <StreakWidget currentStreak={user?.loginStreak || 0} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => (navigation as any).navigate('EditProfile')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuText}>Edit Profile</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => (navigation as any).navigate('Subscription')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>💳</Text>
          <Text style={styles.menuText}>Subscription & Credits</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => (navigation as any).navigate('TransactionHistory')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Transaction History</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={styles.menuText}>Notifications</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={styles.menuText}>Privacy & Security</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Help & Support</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>📄</Text>
          <Text style={styles.menuText}>Terms & Privacy</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B1E',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#8B7FFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B7FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F3FF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  creditsCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  creditsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F3FF',
  },
  creditsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  buyCreditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B7FFF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buyCreditsIcon: {
    fontSize: 20,
  },
  buyCreditsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#111827',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F3FF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#F5F3FF',
  },
  menuArrow: {
    fontSize: 24,
    color: '#52525B',
  },
  logoutButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  version: {
    fontSize: 12,
    color: '#52525B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0B1E',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F3FF',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    marginTop: 8,
  },
});
