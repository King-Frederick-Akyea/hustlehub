import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingNavigator from './OnboardingNavigator';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import VerificationNavigator, { resumeRouteFor } from './VerificationNavigator';
import { Loading } from '../components/Shared';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from './navigationRef';
import { usePushNotifications } from '../hooks/usePushNotifications';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const { isAuthenticated, isLoading: authLoading, hasCompletedOnboarding, user } = useAuth();

  usePushNotifications(isAuthenticated);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      setHasSeenOnboarding(onboardingComplete === 'true');
    } catch (error) {
      console.error('Error checking initial state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
    setHasSeenOnboarding(true);
  };

  if (isLoading || authLoading) {
    return <Loading text="Loading..." />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!hasSeenOnboarding ? (
          <Stack.Screen name="OnboardingFlow">
            {() => <OnboardingNavigator onComplete={handleOnboardingComplete} />}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !hasCompletedOnboarding ? (
          <Stack.Screen name="Verification">
            {() => <VerificationNavigator initialRoute={resumeRouteFor(user?.verificationStatus)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
