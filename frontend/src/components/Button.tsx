import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) => {
  const getButtonStyle = () => {
    const baseStyle: StyleProp<ViewStyle>[] = [styles.button, styles[`button_${size}`]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostButton);
        break;
      case 'danger':
        baseStyle.push(styles.dangerButton);
        break;
      default:
        baseStyle.push(styles.primaryButton);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledButton);
    }
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseStyle: StyleProp<TextStyle>[] = [styles.buttonText, styles[`buttonText_${size}`]];
    
    switch (variant) {
      case 'primary':
      case 'danger':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineText);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostText);
        break;
      default:
        baseStyle.push(styles.primaryText);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledText);
    }
    
    return baseStyle;
  };
  
  const getIconColor = () => {
    if (disabled) return colors.disabled;
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.textInverse;
      case 'secondary':
        return colors.textInverse;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.textInverse;
    }
  };
  
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  
  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse} 
          size="small" 
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={iconSize} 
              color={getIconColor()} 
              style={styles.iconLeft} 
            />
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={iconSize} 
              color={getIconColor()} 
              style={styles.iconRight} 
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 36,
  },
  button_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  button_lg: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  disabledButton: {
    backgroundColor: colors.border,
    borderColor: colors.border,
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    fontWeight: typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  buttonText_sm: {
    fontSize: typography.fontSize.md,
  },
  buttonText_md: {
    fontSize: typography.fontSize.base,
  },
  buttonText_lg: {
    fontSize: typography.fontSize.lg,
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryText: {
    color: colors.textInverse,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  disabledText: {
    color: colors.disabled,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default Button;
