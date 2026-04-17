import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryPersistProvider } from './src/providers/QueryPersistProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { StatusBarConfig } from './src/components/StatusBarConfig';

export default function App() {
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
