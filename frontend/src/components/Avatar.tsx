import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'busy';
  showBadge?: boolean;
  badgeCount?: number;
  style?: StyleProp<ViewStyle>;
}

const Avatar = ({
  source,
  name,
  size = 'md', // xs, sm, md, lg, xl
  showStatus = false,
  status = 'offline', // online, offline, busy
  showBadge = false,
  badgeCount = 0,
  style,
}: AvatarProps) => {
  const getSizeValue = () => {
    switch (size) {
      case 'xs': return 32;
      case 'sm': return 40;
      case 'md': return 48;
      case 'lg': return 64;
      case 'xl': return 96;
      default: return 48;
    }
  };
  
  const getInitials = () => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };
  
  const sizeValue = getSizeValue();
  const fontSize = sizeValue / 2.5;
  const statusSize = sizeValue / 4;
  const badgeSize = sizeValue / 2.5;
  
  const getStatusColor = () => {
    switch (status) {
      case 'online': return colors.success;
      case 'busy': return colors.warning;
      default: return colors.disabled;
    }
  };
  
  return (
    <View style={[styles.container, { width: sizeValue, height: sizeValue }, style]}>
      {source ? (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={[
            styles.image,
            { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{getInitials()}</Text>
        </View>
      )}
      
      {showStatus && (
        <View
          style={[
            styles.status,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              backgroundColor: getStatusColor(),
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
      
      {showBadge && badgeCount > 0 && (
        <View
          style={[
            styles.badge,
            {
              minWidth: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: colors.surfaceSecondary,
  } as ImageStyle,
  placeholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semiBold,
  },
  status: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});

export default Avatar;
