import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { typography } from '../constants/typography';
import Avatar from './Avatar';
import Badge, { BadgeVariant } from './Badge';

const TaskCard = ({
  task,
  onPress,
  showBidCount = true,
  showUser = true,
  compact = false,
  style,
}) => {
  const {
    title,
    description,
    category,
    budget,
    location,
    deadline,
    status,
    bidCount,
    user,
    isBarter,
    barterOffer,
  } = task;
  
  const getStatusBadge = (): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'open':
        return { label: 'Open', variant: 'success' };
      case 'bidding':
        return { label: 'Bidding', variant: 'info' };
      case 'assigned':
        return { label: 'Assigned', variant: 'primary' };
      case 'in_progress':
        return { label: 'In Progress', variant: 'warning' };
      case 'completed':
        return { label: 'Completed', variant: 'success' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'error' };
      default:
        return { label: status, variant: 'default' };
    }
  };
  
  const statusBadge = getStatusBadge();
  
  const getCategoryIcon = () => {
    const iconMap = {
      grocery: 'cart',
      laundry: 'shirt',
      documents: 'document-text',
      queue: 'people',
      delivery: 'bicycle',
      tutoring: 'school',
      cleaning: 'sparkles',
      tech: 'laptop',
      moving: 'cube',
      other: 'ellipsis-horizontal',
    };
    return iconMap[category] || 'ellipsis-horizontal';
  };
  
  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactIconContainer}>
          <Ionicons name={getCategoryIcon()} size={20} color={colors.primary} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.compactBudget}>
            {isBarter ? 'Barter' : `GH₵ ${budget}`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <View style={styles.categoryIcon}>
            <Ionicons name={getCategoryIcon()} size={18} color={colors.primary} />
          </View>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        <Badge label={statusBadge.label} variant={statusBadge.variant} size="sm" />
      </View>
      
      {/* Content */}
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      {description && (
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      )}
      
      {/* Barter Tag */}
      {isBarter && (
        <View style={styles.barterContainer}>
          <Ionicons name="swap-horizontal" size={16} color={colors.accent} />
          <Text style={styles.barterText}>Barter: {barterOffer}</Text>
        </View>
      )}
      
      {/* Meta Info */}
      <View style={styles.metaContainer}>
        {location && (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{location}</Text>
          </View>
        )}
        {deadline && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{deadline}</Text>
          </View>
        )}
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        {showUser && user && (
          <View style={styles.userContainer}>
            <Avatar source={user.avatar} name={user.name} size="xs" />
            <Text style={styles.userName}>{user.name}</Text>
            {user.verified && (
              <Ionicons name="checkmark-circle" size={14} color={colors.verified} />
            )}
          </View>
        )}
        
        <View style={styles.rightFooter}>
          {showBidCount && bidCount !== undefined && (
            <View style={styles.bidContainer}>
              <Ionicons name="hand-left-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.bidCount}>{bidCount} bids</Text>
            </View>
          )}
          
          <Text style={styles.budget}>
            {isBarter ? 'Barter' : `GH₵ ${budget}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.md * 1.4,
    marginBottom: spacing.md,
  },
  barterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  barterText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.base,
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  rightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bidCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  budget: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  compactBudget: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary,
    fontWeight: typography.fontWeight.semiBold,
  },
});

export default TaskCard;
