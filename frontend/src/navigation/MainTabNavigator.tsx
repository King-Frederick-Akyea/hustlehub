// src/navigation/MainTabNavigator.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useRole } from '../context/RoleContext';

import {
  HomeScreen,
  TasksScreen,
  ProfileScreen,
  NotificationScreen,
  MessagesScreen,
  MyTasksScreen,
} from '../screens/main';

const Tab = createBottomTabNavigator();
const EmptyScreen = () => null;

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentRole } = useRole();

  const isPoster = currentRole === 'poster';

  // Define tabs based on current role
  const getTabs = () => {
    if (isPoster) {
      // Poster: Home, Messages, Post (center), My Tasks, Profile
      return [
        { name: 'HomeTab', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
        { name: 'MessagesScreen', label: 'Messages', icon: 'chatbubble', iconOutline: 'chatbubble-outline' },
        { name: 'PostTab', label: 'Post', icon: 'add', isCenter: true },
        { name: 'MyTasksScreen', label: 'My Tasks', icon: 'list', iconOutline: 'list-outline' },
        { name: 'ProfileTab', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
      ];
    } else {
      // Tasker: Home, Explore, Messages, My Tasks, Profile (no center)
      return [
        { name: 'HomeTab', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
        { name: 'SearchTab', label: 'Explore', icon: 'compass', iconOutline: 'compass-outline' },
        { name: 'MessagesScreen', label: 'Messages', icon: 'chatbubble', iconOutline: 'chatbubble-outline' },
        { name: 'MyTasksScreen', label: 'My Tasks', icon: 'list', iconOutline: 'list-outline' },
        { name: 'ProfileTab', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
      ];
    }
  };

  const tabs = getTabs();

  const renderTab = (tab, index) => {
    const route = state.routes.find(r => r.name === tab.name);
    const isFocused = route ? state.index === state.routes.indexOf(route) : false;

    const onPress = () => {
      if (tab.name === 'PostTab') {
        navigation.navigate('CreateTask');
        return;
      }

      if (route) {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(tab.name);
        }
      }
    };

    const iconName = isFocused ? tab.icon : tab.iconOutline;
    const iconColor = isFocused ? colors.primary : colors.textTertiary;

    if (tab.isCenter) {
      return (
        <TouchableOpacity
          key={tab.name}
          onPress={onPress}
          style={styles.centerButtonWrapper}
          activeOpacity={0.85}
        >
          <View style={[styles.centerButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={tab.name}
        onPress={onPress}
        style={styles.tabItem}
        activeOpacity={0.7}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => renderTab(tab, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 72,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    height: 56,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textTertiary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

const MainTabNavigator = () => {
  const { currentRole } = useRole();

  const isPoster = currentRole === 'poster';

  // Define screens conditionally
  const screens = [
    { name: 'HomeTab', component: HomeScreen },
    { name: 'SearchTab', component: TasksScreen, show: !isPoster }, // only for tasker
    { name: 'PostTab', component: EmptyScreen, show: isPoster }, // only for poster
    { name: 'MessagesScreen', component: MessagesScreen },
    { name: 'MyTasksScreen', component: MyTasksScreen },
    { name: 'ProfileTab', component: ProfileScreen },
  ];

  const visibleScreens = screens.filter(screen => screen.show !== false);

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {visibleScreens.map((screen) => (
        <Tab.Screen key={screen.name} name={screen.name} component={screen.component} />
      ))}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;