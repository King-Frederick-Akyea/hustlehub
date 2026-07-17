import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Badge = ({
  label,
  variant = 'default', // default, success, warning, error, info, primary, secondary
  size = 'md', // sm, md, lg
  dot = false,
  style,
}: BadgeProps) => {
  const getBadgeStyle = () => {
    const baseStyle: StyleProp<ViewStyle>[] = [styles.badge, styles[`badge_${size}`]];
    
    switch (variant) {
      case 'success':
        baseStyle.push(styles.successBadge);
        break;
      case 'warning':
        baseStyle.push(styles.warningBadge);
        break;
      case 'error':
        baseStyle.push(styles.errorBadge);
        break;
      case 'info':
        baseStyle.push(styles.infoBadge);
        break;
      case 'primary':
        baseStyle.push(styles.primaryBadge);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryBadge);
        break;
      default:
        baseStyle.push(styles.defaultBadge);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseStyle: StyleProp<TextStyle>[] = [styles.text, styles[`text_${size}`]];
    
    switch (variant) {
      case 'success':
        baseStyle.push(styles.successText);
        break;
      case 'warning':
        baseStyle.push(styles.warningText);
        break;
      case 'error':
        baseStyle.push(styles.errorText);
        break;
      case 'info':
        baseStyle.push(styles.infoText);
        break;
      case 'primary':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      default:
        baseStyle.push(styles.defaultText);
    }
    
    return baseStyle;
  };
  
  const getDotColor = () => {
    switch (variant) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'info': return colors.info;
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      default: return colors.textSecondary;
    }
  };
  
  if (dot) {
    return (
      <View style={[styles.dotContainer, style]}>
        <View style={[styles.dot, { backgroundColor: getDotColor() }]} />
        <Text style={styles.dotText}>{label}</Text>
      </View>
    );
  }
  
  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badge_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badge_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  badge_lg: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  defaultBadge: {
    backgroundColor: colors.surfaceSecondary,
  },
  successBadge: {
    backgroundColor: colors.successLight,
  },
  warningBadge: {
    backgroundColor: colors.warningLight,
  },
  errorBadge: {
    backgroundColor: colors.errorLight,
  },
  infoBadge: {
    backgroundColor: colors.infoLight,
  },
  primaryBadge: {
    backgroundColor: colors.primary,
  },
  secondaryBadge: {
    backgroundColor: colors.secondary,
  },
  text: {
    fontWeight: typography.fontWeight.medium,
  },
  text_sm: {
    fontSize: typography.fontSize.xs,
  },
  text_md: {
    fontSize: typography.fontSize.sm,
  },
  text_lg: {
    fontSize: typography.fontSize.md,
  },
  defaultText: {
    color: colors.textSecondary,
  },
  successText: {
    color: colors.secondary,
  },
  warningText: {
    color: colors.warning,
  },
  errorText: {
    color: colors.error,
  },
  infoText: {
    color: colors.info,
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryText: {
    color: colors.textInverse,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  dotText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
});

export default Badge;
