import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { getListings, getMyListings, ListingItem } from '../../services/rentalService';
import { formatRelativeTime, resolveAvatarUrl } from '../../utils/taskDisplay';
import { Loading } from '../../components/Shared';
import Avatar from '../../components/Avatar';
import type { ScreenProps } from '../../navigation/types';

type FilterTab = 'all' | 'barter' | 'rental' | 'mine';

const OFFER_STATUS_LABEL: Record<string, string> = {
  pending: 'Offer Pending',
  accepted: 'Offer Accepted',
};

const RentalsScreen = ({ navigation }: ScreenProps<'Rentals'>) => {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      setListings(activeFilter === 'mine' ? await getMyListings() : await getListings());
    } catch (error) {
      console.warn('Failed to load listings', error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [loadListings])
  );

  const viewingMine = activeFilter === 'mine';
  const filteredItems =
    activeFilter === 'barter' || activeFilter === 'rental'
      ? listings.filter((item) => item.type.toLowerCase() === activeFilter)
      : listings;

  const renderItem = ({ item }: { item: ListingItem }) => {
    const activeOfferStatus = item.myOfferStatus && OFFER_STATUS_LABEL[item.myOfferStatus]
      ? item.myOfferStatus
      : null;

    return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ListingDetails', { listingId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.typeBadge,
          { backgroundColor: item.type === 'barter' ? `${colors.accent}20` : `${colors.primary}20` }
        ]}>
          <Text style={[
            styles.typeBadgeText,
            { color: item.type === 'barter' ? colors.accent : colors.primary }
          ]}>
            {item.type === 'barter' ? 'Barter' : 'Rental'}
          </Text>
        </View>
        <Text style={styles.timePosted}>{formatRelativeTime(item.createdAt)}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>

      {item.type === 'barter' ? (
        <View style={styles.barterDetails}>
          <View style={styles.barterItem}>
            <Text style={styles.barterLabel}>Offering:</Text>
            <Text style={styles.barterValue}>{item.offering}</Text>
          </View>
          <View style={styles.barterExchange}>
            <Ionicons name="swap-horizontal" size={20} color={colors.accent} />
          </View>
          <View style={styles.barterItem}>
            <Text style={styles.barterLabel}>Seeking:</Text>
            <Text style={styles.barterValue}>{item.seeking}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.rentalDetails}>
          <Text style={styles.rentalDescription} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.rentalRate}>
            {item.dailyRate != null ? `GH¢${item.dailyRate}/day` : 'Barter only'}
          </Text>
        </View>
      )}

      {item.type === 'rental' && item.barterAccepted && item.seeking && (
        <View style={styles.barterHint}>
          <Ionicons name="swap-horizontal" size={14} color={colors.accent} />
          <Text style={styles.barterHintText}>Also open to trade for: {item.seeking}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.posterInfo}>
          <Avatar source={resolveAvatarUrl(item.owner.avatarUrl)} name={item.owner.fullName} size="xs" />
          <View style={{ marginLeft: spacing.sm }}>
            <Text style={styles.posterName}>{viewingMine ? 'You' : item.owner.fullName}</Text>
            {item.owner.verified && (
              <View style={styles.ratingRow}>
                <Ionicons name="checkmark-circle" size={12} color={colors.verified} />
                <Text style={styles.ratingText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.offerButton, activeOfferStatus && styles.offerButtonSent]}
          onPress={() => navigation.navigate('ListingDetails', { listingId: item.id })}
        >
          <Text style={[styles.offerButtonText, activeOfferStatus && styles.offerButtonTextSent]}>
            {viewingMine
              ? `View Offers${item.offerCount > 0 ? ` (${item.offerCount})` : ''}`
              : activeOfferStatus
                ? OFFER_STATUS_LABEL[activeOfferStatus]
                : item.type === 'barter' ? 'Offer' : 'Rent'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Barter & Rentals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateListing')}
        >
          <Ionicons name="add" size={24} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'barter' && styles.filterTabActive]}
          onPress={() => setActiveFilter('barter')}
        >
          <Ionicons
            name="swap-horizontal"
            size={16}
            color={activeFilter === 'barter' ? colors.textInverse : colors.textSecondary}
            style={{ marginRight: spacing.xs }}
          />
          <Text style={[styles.filterText, activeFilter === 'barter' && styles.filterTextActive]}>
            Barter
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'rental' && styles.filterTabActive]}
          onPress={() => setActiveFilter('rental')}
        >
          <Ionicons
            name="cube-outline"
            size={16}
            color={activeFilter === 'rental' ? colors.textInverse : colors.textSecondary}
            style={{ marginRight: spacing.xs }}
          />
          <Text style={[styles.filterText, activeFilter === 'rental' && styles.filterTextActive]}>
            Rentals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'mine' && styles.filterTabActive]}
          onPress={() => setActiveFilter('mine')}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={activeFilter === 'mine' ? colors.textInverse : colors.textSecondary}
            style={{ marginRight: spacing.xs }}
          />
          <Text style={[styles.filterText, activeFilter === 'mine' && styles.filterTextActive]}>
            Mine
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {loading ? (
        <Loading text="Loading listings..." />
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyStateText}>
                {viewingMine ? "You haven't posted any listings yet" : 'No listings yet'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
  },
  timePosted: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  barterDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  barterItem: {
    flex: 1,
  },
  barterLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  barterValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  barterExchange: {
    paddingHorizontal: spacing.sm,
  },
  rentalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rentalDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  rentalRate: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  barterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  barterHintText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  posterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posterName: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  offerButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  offerButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textInverse,
  },
  offerButtonSent: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerButtonTextSent: {
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

export default RentalsScreen;
