import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

const Header = ({
  title,
  subtitle,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  rightComponent,
  transparent = false,
  centerTitle = true,
  style,
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={[
        styles.container,
        transparent && styles.transparent,
        { paddingTop: insets.top },
        style,
      ]}
    >
      <StatusBar
        barStyle={transparent ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : colors.surface}
        translucent
      />
      
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {leftIcon && (
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={leftIcon}
                size={24}
                color={transparent ? colors.textInverse : colors.textPrimary}
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Center Section */}
        <View style={[styles.centerSection, !centerTitle && styles.leftAlign]}>
          {title && (
            <Text
              style={[
                styles.title,
                transparent && styles.transparentText,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                transparent && styles.transparentSubtitle,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightComponent ? (
            rightComponent
          ) : rightIcon ? (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={rightIcon}
                size={24}
                color={transparent ? colors.textInverse : colors.textPrimary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.base,
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftAlign: {
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: spacing.sm,
    margin: -spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transparentText: {
    color: colors.textInverse,
  },
  transparentSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default Header;
