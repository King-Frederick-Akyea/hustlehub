import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation';
import { colors } from './src/constants/colors';
import { AuthProvider } from './src/context/AuthContext';
import { RoleProvider } from './src/context/RoleContext';

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar style="dark" backgroundColor={colors.surface} />
            <RootNavigator />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </RoleProvider>
    </AuthProvider>
  );
}
