import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { typography } from '../constants/typography';
import Avatar from './Avatar';
import Badge, { BadgeVariant } from './Badge';
import Button from './Button';

const BidCard = ({
  bid,
  onAccept,
  onReject,
  onPress,
  isOwner = false,
  showActions = true,
  style,
}) => {
  const {
    amount,
    message,
    deliveryTime,
    status,
    user,
    createdAt,
    isBarter,
    barterOffer,
  } = bid;
  
  const getStatusBadge = (): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'warning' };
      case 'accepted':
        return { label: 'Accepted', variant: 'success' };
      case 'rejected':
        return { label: 'Rejected', variant: 'error' };
      case 'withdrawn':
        return { label: 'Withdrawn', variant: 'default' };
      default:
        return { label: status, variant: 'default' };
    }
  };
  
  const statusBadge = getStatusBadge();
  
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userContainer}>
          <Avatar source={user?.avatar} name={user?.name} size="md" />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name}</Text>
              {user?.verified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.verified} />
              )}
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text style={styles.rating}>{user?.rating || '4.8'}</Text>
              <Text style={styles.completedTasks}>({user?.completedTasks || 0} tasks)</Text>
            </View>
          </View>
        </View>
        <Badge label={statusBadge.label} variant={statusBadge.variant} size="sm" />
      </View>
      
      {/* Bid Amount */}
      <View style={styles.amountContainer}>
        {isBarter ? (
          <View style={styles.barterContainer}>
            <Ionicons name="swap-horizontal" size={20} color={colors.accent} />
            <Text style={styles.barterLabel}>Barter Offer:</Text>
            <Text style={styles.barterOffer}>{barterOffer}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.amountLabel}>Bid Amount</Text>
            <Text style={styles.amount}>GH₵ {amount}</Text>
          </>
        )}
      </View>
      
      {/* Message */}
      {message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Message</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      )}
      
      {/* Delivery Time */}
      {deliveryTime && (
        <View style={styles.deliveryContainer}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.deliveryText}>Can deliver in: {deliveryTime}</Text>
        </View>
      )}
      
      {/* Timestamp */}
      <Text style={styles.timestamp}>{createdAt}</Text>
      
      {/* Actions */}
      {isOwner && showActions && status === 'pending' && (
        <View style={styles.actionsContainer}>
          <Button
            title="Reject"
            onPress={onReject}
            variant="outline"
            size="sm"
            style={styles.rejectButton}
          />
          <Button
            title="Accept"
            onPress={onAccept}
            variant="primary"
            size="sm"
            style={styles.acceptButton}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  rating: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  completedTasks: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  amountContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  amountLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  barterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  barterLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  barterOffer: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.accent,
    flex: 1,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  messageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.md * 1.5,
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deliveryText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  timestamp: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rejectButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  acceptButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});

export default BidCard;
