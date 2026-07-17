import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows } from '../constants/spacing';

const Card = ({
  children,
  variant = 'elevated', // elevated, outlined, flat
  padding = 'md', // none, sm, md, lg
  onPress,
  style,
  disabled = false,
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card, styles[`padding_${padding}`]];
    
    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.elevated);
        break;
      case 'outlined':
        baseStyle.push(styles.outlined);
        break;
      case 'flat':
        baseStyle.push(styles.flat);
        break;
      default:
        baseStyle.push(styles.elevated);
    }
    
    return baseStyle;
  };
  
  if (onPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return <View style={[getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing.sm,
  },
  padding_md: {
    padding: spacing.base,
  },
  padding_lg: {
    padding: spacing.xl,
  },
  elevated: {
    ...shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.surfaceSecondary,
  },
});

export default Card;
