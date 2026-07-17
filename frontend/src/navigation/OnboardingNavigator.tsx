import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  OnboardingScreen,
} from '../screens/onboarding';

const Stack = createStackNavigator();

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding">
        {() => <OnboardingScreen onComplete={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
