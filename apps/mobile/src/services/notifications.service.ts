import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiService } from './api.service';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private token: string | null = null;

  /**
   * Register for push notifications and send token to backend.
   * Call this after user login.
   */
  async register(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('[Notifications] Skipping — not a physical device');
      return null;
    }

    // Check/request permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission denied');
      return null;
    }

    // Get push token (Expo push or FCM depending on config)
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      this.token = tokenData.data;

      // Send token to backend via dedicated endpoint
      await apiService.updatePushToken(this.token).catch(() => {
        console.log('[Notifications] Failed to send token to backend');
      });

      console.log('[Notifications] Registered with token:', this.token.substring(0, 20) + '...');
    } catch (err: any) {
      // Expected in Expo Go — projectId not available without EAS build
      if (__DEV__) console.log('[Notifications] Skipped in dev:', err?.message?.slice(0, 60));
      return null;
    }

    // Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
      });

      await Notifications.setNotificationChannelAsync('rewards', {
        name: 'Rewards & Credits',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return this.token;
  }

  /**
   * Add a listener for when a notification is received while app is foregrounded.
   */
  onForegroundNotification(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Add a listener for when user taps a notification (foreground or background).
   * Use this for deep link navigation.
   */
  onNotificationTapped(handler: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  /**
   * Get the notification that was used to open the app (cold start).
   */
  async getInitialNotification(): Promise<Notifications.NotificationResponse | null> {
    return Notifications.getLastNotificationResponseAsync();
  }

  /**
   * Clear badge count.
   */
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }

  getToken(): string | null {
    return this.token;
  }
}

export const notificationService = new NotificationService();
