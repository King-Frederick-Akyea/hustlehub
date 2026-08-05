// src/screens/main/ListingDetailsScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { formatRelativeTime, resolveAvatarUrl } from '../../utils/taskDisplay';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../api/errors';
import { startConversationWith } from '../../services/messageService';
import {
  getListing,
  getOffersForListing,
  makeOffer,
  acceptOffer,
  rejectOffer,
  withdrawOffer,
  ListingItem,
  ListingOfferItem,
  ListingOfferType,
} from '../../services/rentalService';
import { Loading } from '../../components/Shared';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import type { ScreenProps } from '../../navigation/types';

const OFFER_STATUS_BADGE: Record<string, { label: string; variant: any }> = {
  pending: { label: 'Pending', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  withdrawn: { label: 'Withdrawn', variant: 'default' },
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;
// scrollContent (below) applies paddingHorizontal: spacing.lg, so the gallery's own nested
// horizontal ScrollView viewport is the screen width minus that padding on both sides, not the
// full screen width - pagingEnabled needs pages sized to match that exactly or it mis-snaps.
const GALLERY_WIDTH = Dimensions.get('window').width - spacing.lg * 2;

const ListingGallery = ({
  imageUrls,
  onPressImage,
}: {
  imageUrls: string[];
  onPressImage: (url: string) => void;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  if (imageUrls.length === 0) return null;

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / GALLERY_WIDTH))}
      >
        {imageUrls.map((url) => (
          <TouchableOpacity key={url} activeOpacity={0.9} onPress={() => onPressImage(url)}>
            <Image source={{ uri: `${API_URL}${url}` }} style={styles.galleryImage} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>
      {imageUrls.length > 1 && (
        <View style={styles.galleryDots}>
          {imageUrls.map((url, i) => (
            <View key={url} style={[styles.galleryDot, i === activeIndex && styles.galleryDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

const ListingDetailsScreen = ({ navigation, route }: ScreenProps<'ListingDetails'>) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const listingId: string | undefined = route.params?.listingId;

  const [listing, setListing] = useState<ListingItem | null>(null);
  const [offers, setOffers] = useState<ListingOfferItem[]>([]);
  const [loadingListing, setLoadingListing] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [offerMode, setOfferMode] = useState<ListingOfferType>('cash');
  const [durationDays, setDurationDays] = useState('');
  const [barterMessage, setBarterMessage] = useState('');
  const [offerError, setOfferError] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  const isOwner = !!(listing && user && listing.owner.id === user.id);
  const canCash = !!listing && listing.type === 'rental' && listing.dailyRate != null;
  const canBarter = !!listing && (listing.type === 'barter' || listing.barterAccepted);

  const loadListing = useCallback(async () => {
    if (!listingId) return;
    setLoadingListing(true);
    setLoadError('');
    try {
      const fetched = await getListing(listingId);
      setListing(fetched);
      if (user && fetched.owner.id === user.id) {
        const fetchedOffers = await getOffersForListing(listingId);
        setOffers(fetchedOffers);
      }
    } catch (error) {
      setLoadError(parseApiError(error).message);
    } finally {
      setLoadingListing(false);
    }
  }, [listingId, user]);

  useFocusEffect(
    useCallback(() => {
      loadListing();
    }, [loadListing])
  );

  // Default the offer form to whichever payment type this listing accepts, preferring cash.
  useEffect(() => {
    if (!listing) return;
    const cash = listing.type === 'rental' && listing.dailyRate != null;
    const barter = listing.type === 'barter' || listing.barterAccepted;
    setOfferMode(cash ? 'cash' : barter ? 'barter' : 'cash');
  }, [listing?.id]);

  const handleMessage = async () => {
    if (!listing) return;
    try {
      const conversation = await startConversationWith(listing.owner.id);
      navigation.navigate('ChatDetail', { conversationId: conversation.id });
    } catch (error) {
      Alert.alert('Could not start conversation', parseApiError(error).message);
    }
  };

  const handleSubmitOffer = async () => {
    if (!listing) return;
    setOfferError('');

    if (offerMode === 'cash') {
      const days = parseInt(durationDays, 10);
      if (!durationDays || isNaN(days) || days <= 0) {
        setOfferError('Enter how many days you want to rent for.');
        return;
      }
    } else {
      if (barterMessage.trim() === '') {
        setOfferError('Describe what you’re proposing.');
        return;
      }
    }

    setOfferLoading(true);
    try {
      await makeOffer(listing.id, offerMode === 'cash'
        ? { offerType: 'cash', durationDays: parseInt(durationDays, 10) }
        : { offerType: 'barter', barterMessage: barterMessage.trim() }
      );
      setDurationDays('');
      setBarterMessage('');
      Alert.alert('Offer sent', 'Your offer has been submitted to the owner.');
      loadListing();
    } catch (error) {
      setOfferError(parseApiError(error).message);
    } finally {
      setOfferLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setActionLoading(true);
    try {
      const result = await acceptOffer(offerId);
      if (result.paymentFailed) {
        Alert.alert(
          'Offer accepted, but payment failed',
          `Offer accepted, but payment couldn't be completed (${result.paymentFailureReason || 'insufficient funds'}) — the renter needs to top up their wallet.`
        );
      } else {
        Alert.alert('Offer accepted', 'The offer has been accepted and the listing is now closed.');
      }
      loadListing();
    } catch (error) {
      Alert.alert('Could not accept offer', parseApiError(error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    setActionLoading(true);
    try {
      await rejectOffer(offerId);
      loadListing();
    } catch (error) {
      Alert.alert('Could not reject offer', parseApiError(error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawOffer = (offerId: string) => {
    Alert.alert('Withdraw offer?', 'This cancels your offer. Any held funds will be refunded to your wallet.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await withdrawOffer(offerId);
            loadListing();
          } catch (error) {
            Alert.alert('Could not withdraw offer', parseApiError(error).message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loadingListing && !listing) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Loading text="Loading listing..." />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: spacing.xl }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {loadError || 'This listing could not be found.'}
        </Text>
        <TouchableOpacity style={[styles.primaryButton, { marginTop: spacing.lg }]} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const durationNum = parseInt(durationDays, 10);
  const total =
    listing.dailyRate != null && !isNaN(durationNum) && durationNum > 0
      ? listing.dailyRate * durationNum
      : null;

  const isInsufficientBalanceError = offerError.toLowerCase().includes('insufficient wallet balance');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ListingGallery
          imageUrls={listing.imageUrls}
          onPressImage={(url) => navigation.navigate('ImageViewer', { imageUrl: url })}
        />

        <View style={[styles.badgeRow, listing.imageUrls.length > 0 && { marginTop: spacing.md }]}>
          <View style={[
            styles.typeBadge,
            { backgroundColor: listing.type === 'barter' ? `${colors.accent}20` : `${colors.primary}20` },
          ]}>
            <Text style={[
              styles.typeBadgeText,
              { color: listing.type === 'barter' ? colors.accent : colors.primary },
            ]}>
              {listing.type === 'barter' ? 'Barter' : 'Rental'}
            </Text>
          </View>
          {listing.status === 'closed' && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>Closed</Text>
            </View>
          )}
          <Text style={styles.timePosted}>{formatRelativeTime(listing.createdAt)}</Text>
        </View>

        <Text style={styles.title}>{listing.title}</Text>

        <TouchableOpacity
          style={styles.ownerCard}
          activeOpacity={isOwner ? 1 : 0.7}
          onPress={isOwner ? undefined : () => navigation.navigate('UserProfile', { userId: listing.owner.id })}
        >
          <Avatar source={resolveAvatarUrl(listing.owner.avatarUrl)} name={listing.owner.fullName} size="md" />
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>{isOwner ? 'You' : listing.owner.fullName}</Text>
            {listing.owner.verified && (
              <View style={styles.ownerMeta}>
                <Ionicons name="checkmark-circle" size={14} color={colors.verified} />
                <Text style={styles.ownerVerified}> Verified</Text>
              </View>
            )}
          </View>
          {!isOwner && (
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms</Text>
          {listing.type === 'barter' ? (
            <View style={styles.barterDetails}>
              <View style={styles.barterItem}>
                <Text style={styles.barterLabel}>Offering:</Text>
                <Text style={styles.barterValue}>{listing.offering}</Text>
              </View>
              <View style={styles.barterExchange}>
                <Ionicons name="swap-horizontal" size={22} color={colors.accent} />
              </View>
              <View style={styles.barterItem}>
                <Text style={styles.barterLabel}>Seeking:</Text>
                <Text style={styles.barterValue}>{listing.seeking}</Text>
              </View>
            </View>
          ) : (
            <>
              {listing.dailyRate != null ? (
                <View style={styles.rateCard}>
                  <View style={styles.rateIcon}>
                    <Ionicons name="cash" size={20} color={colors.success} />
                  </View>
                  <View>
                    <Text style={styles.rateLabel}>Daily Rate</Text>
                    <Text style={styles.rateValue}>GH¢ {listing.dailyRate}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.description}>This item is barter-only — no cash rate set.</Text>
              )}
              {listing.barterAccepted && (
                <View style={styles.barterHintCard}>
                  <Ionicons name="swap-horizontal" size={18} color={colors.accent} />
                  <Text style={styles.barterHintCardText}>
                    Also accepts a barter trade for: {listing.seeking || 'anything of value'}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Offers Received {offers.length > 0 ? `(${offers.length})` : ''}
            </Text>
            {offers.length === 0 ? (
              <Text style={styles.description}>No offers yet.</Text>
            ) : (
              offers.map((offer) => {
                const badge = OFFER_STATUS_BADGE[offer.status] ?? { label: offer.status, variant: 'default' };
                const cashTotal =
                  offer.offerType === 'cash' && listing.dailyRate != null && offer.durationDays
                    ? (listing.dailyRate * offer.durationDays).toFixed(2)
                    : null;
                return (
                  <View key={offer.id} style={styles.offerRow}>
                    <TouchableOpacity
                      style={styles.offerRequesterTouchable}
                      onPress={() => navigation.navigate('UserProfile', { userId: offer.requester.id })}
                    >
                      <Avatar source={resolveAvatarUrl(offer.requester.avatarUrl)} name={offer.requester.fullName} size="sm" />
                      <View style={styles.offerInfo}>
                        <Text style={styles.ownerName}>{offer.requester.fullName}</Text>
                        <Text style={styles.description}>
                          {offer.offerType === 'cash'
                            ? `Cash · ${offer.durationDays ?? '?'} day${offer.durationDays === 1 ? '' : 's'}${cashTotal ? ` · GH¢ ${cashTotal}` : ''}`
                            : `Trade: ${offer.barterMessage ?? ''}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <Badge label={badge.label} variant={badge.variant} size="sm" />
                    {offer.status === 'pending' && listing.status === 'active' && (
                      <View style={styles.offerActions}>
                        <TouchableOpacity
                          onPress={() => handleRejectOffer(offer.id)}
                          disabled={actionLoading}
                          style={[styles.offerIconButton, { backgroundColor: `${colors.error}15` }]}
                        >
                          <Ionicons name="close" size={16} color={colors.error} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleAcceptOffer(offer.id)}
                          disabled={actionLoading}
                          style={[styles.offerIconButton, { backgroundColor: colors.primary }]}
                        >
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {!isOwner && listing.myOfferStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Offer</Text>
            <View style={styles.offerRow}>
              <View style={styles.offerInfo}>
                <Text style={styles.description}>
                  {listing.myOfferStatus === 'pending'
                    ? "You've made an offer on this listing. The owner hasn't responded yet."
                    : listing.myOfferStatus === 'accepted'
                      ? 'Your offer was accepted!'
                      : 'Your previous offer on this listing was rejected. You can make a new one below.'}
                </Text>
              </View>
              <Badge
                label={OFFER_STATUS_BADGE[listing.myOfferStatus]?.label ?? listing.myOfferStatus}
                variant={OFFER_STATUS_BADGE[listing.myOfferStatus]?.variant ?? 'default'}
                size="sm"
              />
            </View>
            {listing.myOfferStatus === 'pending' && listing.myOfferId && (
              <TouchableOpacity
                style={[styles.withdrawButton, actionLoading && styles.primaryButtonDisabled]}
                onPress={() => handleWithdrawOffer(listing.myOfferId!)}
                disabled={actionLoading}
              >
                <Text style={styles.withdrawButtonText}>Withdraw Offer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!isOwner && listing.status === 'active' && (canCash || canBarter) &&
          (!listing.myOfferStatus || listing.myOfferStatus === 'rejected') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Make an Offer</Text>

            {canCash && canBarter && (
              <View style={styles.offerModeRow}>
                <TouchableOpacity
                  style={[styles.offerModeButton, offerMode === 'cash' && styles.offerModeButtonActive]}
                  onPress={() => setOfferMode('cash')}
                >
                  <Ionicons name="cash-outline" size={18} color={offerMode === 'cash' ? colors.textInverse : colors.textSecondary} />
                  <Text style={[styles.offerModeText, offerMode === 'cash' && styles.offerModeTextActive]}>Pay Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.offerModeButton, offerMode === 'barter' && styles.offerModeButtonActive]}
                  onPress={() => setOfferMode('barter')}
                >
                  <Ionicons name="swap-horizontal" size={18} color={offerMode === 'barter' ? colors.textInverse : colors.textSecondary} />
                  <Text style={[styles.offerModeText, offerMode === 'barter' && styles.offerModeTextActive]}>Propose a Trade</Text>
                </TouchableOpacity>
              </View>
            )}

            {offerMode === 'cash' && canCash ? (
              <>
                <Text style={styles.fieldLabel}>Duration (days)</Text>
                <TextInput
                  style={styles.offerInput}
                  keyboardType="number-pad"
                  placeholder="e.g. 3"
                  placeholderTextColor={colors.placeholder}
                  value={durationDays}
                  onChangeText={setDurationDays}
                />
                {total != null && (
                  <>
                    <Text style={styles.totalText}>Total: GH¢ {total.toFixed(2)}</Text>
                    <Text style={styles.holdNoticeText}>
                      GH₵{total.toFixed(2)} will be held from your wallet when you send this offer.
                    </Text>
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Your proposal</Text>
                <TextInput
                  style={styles.offerTextArea}
                  multiline
                  numberOfLines={3}
                  placeholder="Describe what you're offering in trade..."
                  placeholderTextColor={colors.placeholder}
                  value={barterMessage}
                  onChangeText={setBarterMessage}
                  textAlignVertical="top"
                />
              </>
            )}

            {offerError ? <Text style={styles.hintText}>{offerError}</Text> : null}
            {offerError && isInsufficientBalanceError && (
              <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
                <Text style={styles.topUpLinkText}>Top Up Wallet</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, offerLoading && styles.primaryButtonDisabled]}
              onPress={handleSubmitOffer}
              disabled={offerLoading}
            >
              <Text style={styles.primaryButtonText}>
                {offerLoading ? 'Sending...' : offerMode === 'cash' ? 'Send Rental Request' : 'Send Trade Proposal'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!isOwner && listing.status === 'closed' && (
          <View style={styles.closedState}>
            <Ionicons name="lock-closed-outline" size={26} color={colors.textTertiary} />
            <Text style={styles.closedStateText}>This listing is no longer available</Text>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  closedBadge: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  closedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.error,
  },
  timePosted: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginLeft: 'auto',
  },
  galleryImage: {
    width: GALLERY_WIDTH,
    height: GALLERY_WIDTH * 0.75,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  galleryDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  galleryDotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: 28,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ownerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  ownerName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  ownerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerVerified: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  barterDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  rateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  rateValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.success,
  },
  barterHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  barterHintCardText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  offerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  offerRequesterTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  offerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerModeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  offerModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerModeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  offerModeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  offerModeTextActive: {
    color: colors.textInverse,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  offerInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  offerTextArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 90,
    marginBottom: spacing.sm,
  },
  totalText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  holdNoticeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  topUpLinkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.base,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textInverse,
  },
  withdrawButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.base,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  withdrawButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.error,
  },
  closedState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
  },
  closedStateText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

export default ListingDetailsScreen;
