import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { typography } from '../constants/typography';
import Avatar from './Avatar';
import Badge, { BadgeVariant } from './Badge';

const RentalCard = ({
  item,
  onPress,
  showOwner = true,
  horizontal = false,
  style,
}) => {
  const {
    title,
    description,
    category,
    images,
    pricePerDay,
    pricePerWeek,
    location,
    status,
    owner,
    bidCount,
    condition,
  } = item;
  
  const getStatusBadge = (): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'available':
        return { label: 'Available', variant: 'success' };
      case 'rented':
        return { label: 'Rented', variant: 'warning' };
      case 'pending':
        return { label: 'Pending', variant: 'info' };
      default:
        return { label: status, variant: 'default' };
    }
  };
  
  const statusBadge = getStatusBadge();
  
  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.horizontalCard, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: images?.[0] || 'https://via.placeholder.com/100' }}
          style={styles.horizontalImage}
        />
        <View style={styles.horizontalContent}>
          <View style={styles.horizontalHeader}>
            <Text style={styles.horizontalCategory}>{category}</Text>
            <Badge label={statusBadge.label} variant={statusBadge.variant} size="sm" />
          </View>
          <Text style={styles.horizontalTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.horizontalPrice}>GH₵ {pricePerDay}/day</Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: images?.[0] || 'https://via.placeholder.com/200' }}
          style={styles.image}
        />
        <View style={styles.statusBadge}>
          <Badge label={statusBadge.label} variant={statusBadge.variant} size="sm" />
        </View>
        {condition && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{condition}</Text>
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        
        {description && (
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
        )}
        
        {/* Location */}
        {location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        )}
        
        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <Text style={styles.price}>GH₵ {pricePerDay}</Text>
          <Text style={styles.priceLabel}>/day</Text>
          {pricePerWeek && (
            <>
              <Text style={styles.priceDivider}>•</Text>
              <Text style={styles.weekPrice}>GH₵ {pricePerWeek}/week</Text>
            </>
          )}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          {showOwner && owner && (
            <View style={styles.ownerContainer}>
              <Avatar source={owner.avatar} name={owner.name} size="xs" />
              <Text style={styles.ownerName}>{owner.name}</Text>
              {owner.verified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.verified} />
              )}
            </View>
          )}
          
          {bidCount !== undefined && bidCount > 0 && (
            <View style={styles.bidContainer}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.bidText}>{bidCount} interested</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    overflow: 'hidden',
    marginBottom: spacing.base,
    ...shadows.md,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceSecondary,
  } as ImageStyle,
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  conditionBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  conditionText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    padding: spacing.base,
  },
  category: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
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
    marginBottom: spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  pricingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  priceLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  priceDivider: {
    marginHorizontal: spacing.sm,
    color: colors.textTertiary,
  },
  weekPrice: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerName: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  bidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  // Horizontal styles
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
    width: 260,
    ...shadows.sm,
  },
  horizontalImage: {
    width: 80,
    height: 80,
    backgroundColor: colors.surfaceSecondary,
  } as ImageStyle,
  horizontalContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  horizontalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  horizontalCategory: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  horizontalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  horizontalPrice: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.secondary,
  },
});

export default RentalCard;
