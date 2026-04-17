/**
 * Error tracking service — ready for Sentry or Firebase Crashlytics.
 *
 * To enable Sentry:
 *   npx expo install @sentry/react-native
 *   Then uncomment the Sentry.init() call below.
 *
 * To enable Firebase Crashlytics:
 *   Install @react-native-firebase/crashlytics
 *   Then uncomment the crashlytics() calls.
 *
 * Until then, errors are logged to console.
 */

class ErrorTrackingService {
  private initialized = false;

  initialize() {
    try {
      // === Sentry ===
      // const Sentry = require('@sentry/react-native');
      // Sentry.init({
      //   dsn: 'YOUR_SENTRY_DSN',
      //   tracesSampleRate: 0.2,
      //   environment: __DEV__ ? 'development' : 'production',
      // });

      // === Firebase Crashlytics ===
      // const crashlytics = require('@react-native-firebase/crashlytics').default;
      // crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);

      this.initialized = true;
      if (__DEV__) console.log('[ErrorTracking] Initialized (dev mode — console only)');
    } catch {
      if (__DEV__) console.log('[ErrorTracking] SDK not configured');
    }
  }

  setUser(userId: string, email?: string) {
    // Sentry: Sentry.setUser({ id: userId, email });
    // Crashlytics: crashlytics().setUserId(userId);
    if (__DEV__) console.log('[ErrorTracking] User:', userId.slice(0, 8));
  }

  captureException(error: Error, context?: Record<string, any>) {
    // Sentry: Sentry.captureException(error, { extra: context });
    // Crashlytics: crashlytics().recordError(error);
    console.error('[ErrorTracking]', error.message, context ?? '');
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    // Sentry: Sentry.captureMessage(message, level);
    // Crashlytics: crashlytics().log(message);
    if (__DEV__) console.log(`[ErrorTracking] [${level}] ${message}`);
  }

  addBreadcrumb(message: string, data?: Record<string, any>) {
    // Sentry: Sentry.addBreadcrumb({ message, data, level: 'info' });
    if (__DEV__) console.log('[Breadcrumb]', message, data ?? '');
  }
}

export const errorTracking = new ErrorTrackingService();
