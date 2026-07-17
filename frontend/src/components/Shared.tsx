import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

const EmptyState = ({
  icon = 'folder-open-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={colors.textTertiary} />
      </View>
      
      {title && <Text style={styles.title}>{title}</Text>}
      
      {description && <Text style={styles.description}>{description}</Text>}
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          fullWidth={false}
          style={styles.button}
        />
      )}
    </View>
  );
};

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: StyleProp<ViewStyle>;
}

const Loading = ({ size = 'large', color = colors.primary, text, style }: LoadingProps) => {
  return (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
};

interface DividerProps {
  style?: StyleProp<ViewStyle>;
  text?: string;
}

const Divider = ({ style, text }: DividerProps) => {
  if (text) {
    return (
      <View style={[styles.dividerContainer, style]}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{text}</Text>
        <View style={styles.dividerLine} />
      </View>
    );
  }
  
  return <View style={[styles.divider, style]} />;
};

const styles = StyleSheet.create({
  // Empty State
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.sm,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.base,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.base,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
});

export { EmptyState, Loading, Divider };
