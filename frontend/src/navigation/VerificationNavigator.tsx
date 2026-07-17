import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  EmailVerificationScreen,
  StudentIDUploadScreen,
  FaceVerificationScreen,
  VerificationSuccessScreen,
} from '../screens/auth';
import type { VerificationStatus } from '../services/authService';

const Stack = createStackNavigator();

export function resumeRouteFor(status: VerificationStatus | undefined): string {
  switch (status) {
    case 'email_verified':
      return 'StudentIDUpload';
    case 'id_submitted':
    case 'id_verified':
      return 'FaceVerification';
    case 'rejected':
      return 'StudentIDUpload';
    case 'pending':
    default:
      return 'EmailVerification';
  }
}

interface VerificationNavigatorProps {
  initialRoute: string;
}

const VerificationNavigator: React.FC<VerificationNavigatorProps> = ({ initialRoute }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="StudentIDUpload" component={StudentIDUploadScreen} />
      <Stack.Screen name="FaceVerification" component={FaceVerificationScreen} />
      <Stack.Screen name="VerificationSuccess" component={VerificationSuccessScreen} />
    </Stack.Navigator>
  );
};

export default VerificationNavigator;
