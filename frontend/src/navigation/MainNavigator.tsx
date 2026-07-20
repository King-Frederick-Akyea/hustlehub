import React from 'react';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';

import MainTabNavigator from './MainTabNavigator';
import {
  CreateTaskScreen,
  TaskDetailsScreen,
  NotificationScreen,
  MessagesScreen,
  WalletScreen,
  RentalsScreen,
  ChatDetailScreen,
  EditProfileScreen,
  MyTasksScreen,
  BookmarksScreen,
  ActiveTaskScreen,
  CreateListingScreen,
  ListingDetailsScreen,
} from '../screens/main';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
        }}
      />
      <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
      <Stack.Screen name="ActiveTask" component={ActiveTaskScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Rentals" component={RentalsScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyTasks" component={MyTasksScreen} />
      <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
      <Stack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
        }}
      />
      <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
