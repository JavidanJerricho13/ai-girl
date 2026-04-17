/**
 * Analytics service — Firebase Analytics integration.
 * All events are typed and centralized here.
 *
 * To enable: install @react-native-firebase/app + @react-native-firebase/analytics
 * and configure google-services.json / GoogleService-Info.plist.
 * Until then, events are logged to console in __DEV__.
 */

type EventName =
  | 'app_open'
  | 'onboarding_complete'
  | 'first_message_sent'
  | 'message_sent'
  | 'image_generated'
  | 'voice_generated'
  | 'credits_purchased'
  | 'credits_exhausted'
  | 'push_received'
  | 'push_tapped'
  | 'character_viewed'
  | 'character_shared'
  | 'conversation_started'
  | 'daily_reward_claimed'
  | 'subscription_viewed';

type EventParams = Record<string, string | number | boolean>;

class AnalyticsService {
  private userId: string | null = null;
  private firebaseAnalytics: any = null;

  async initialize() {
    try {
      // Firebase Analytics — will be available after SDK setup
      // const analytics = require('@react-native-firebase/analytics').default;
      // this.firebaseAnalytics = analytics();
      if (__DEV__) console.log('[Analytics] Initialized (dev mode — console only)');
    } catch {
      if (__DEV__) console.log('[Analytics] Firebase not configured, using console');
    }
  }

  setUser(userId: string) {
    this.userId = userId;
    if (this.firebaseAnalytics) {
      this.firebaseAnalytics.setUserId(userId);
    }
    if (__DEV__) console.log('[Analytics] User set:', userId.slice(0, 8));
  }

  async track(event: EventName, params?: EventParams) {
    const enriched = {
      ...params,
      user_id: this.userId,
      timestamp: Date.now(),
    };

    if (this.firebaseAnalytics) {
      await this.firebaseAnalytics.logEvent(event, enriched);
    }

    if (__DEV__) {
      console.log(`[Analytics] ${event}`, params ?? '');
    }
  }

  async trackScreen(screenName: string) {
    if (this.firebaseAnalytics) {
      await this.firebaseAnalytics.logScreenView({
        screen_name: screenName,
        screen_class: screenName,
      });
    }
    if (__DEV__) console.log(`[Analytics] Screen: ${screenName}`);
  }
}

export const analytics = new AnalyticsService();
