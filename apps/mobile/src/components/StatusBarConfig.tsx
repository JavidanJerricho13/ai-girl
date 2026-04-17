import React from 'react';
import { StatusBar } from 'expo-status-bar';

/**
 * Consistent status bar for all screens.
 * Dark app → light status bar content.
 */
export function StatusBarConfig() {
  return <StatusBar style="light" backgroundColor="transparent" translucent />;
}
