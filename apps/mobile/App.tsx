import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryPersistProvider } from './src/providers/QueryPersistProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { StatusBarConfig } from './src/components/StatusBarConfig';
import { analytics } from './src/lib/analytics';
import { errorTracking } from './src/lib/errorTracking';

export default function App() {
  useEffect(() => {
    analytics.initialize();
    errorTracking.initialize();
    analytics.track('app_open');
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryPersistProvider>
          <RootNavigator />
          <StatusBarConfig />
        </QueryPersistProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
