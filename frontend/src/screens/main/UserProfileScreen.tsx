// src/screens/main/UserProfileScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { TASK_CATEGORIES } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import { fetchPublicProfile, PublicProfile } from '../../services/authService';
import { getReviewsForUser, getEligibleEngagements, Review, EligibleEngagement } from '../../services/reviewService';
import { startConversationWith } from '../../services/messageService';
import { parseApiError } from '../../api/errors';
import type { ScreenProps } from '../../navigation/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const specializationLabel = (id: string) => TASK_CATEGORIES.find((c) => c.id === id)?.label ?? id;

const StarRow = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Ionicons
        key={n}
        name={rating >= n ? 'star' : rating >= n - 0.5 ? 'star-half' : 'star-outline'}
        size={size}
        color={colors.accent}
        style={{ marginRight: 2 }}
      />
    ))}
  </View>
);

const UserProfileScreen = ({ navigation, route }: ScreenProps<'UserProfile'>) => {
  const { userId } = route.params;
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.id === userId;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligible, setEligible] = useState<EligibleEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileData, reviewsData, eligibleData] = await Promise.all([
        fetchPublicProfile(userId),
        getReviewsForUser(userId),
        isSelf ? Promise.resolve([]) : getEligibleEngagements(),
      ]);
      setProfile(profileData);
      setReviews(reviewsData);
      setEligible(eligibleData.filter((e) => e.otherParty.id === userId));
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [userId, isSelf]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleMessage = async () => {
    setMessaging(true);
    try {
      const conversation = await startConversationWith(userId);
      navigation.navigate('ChatDetail', { conversationId: conversation.id });
    } catch (err) {
      Alert.alert('Could not start conversation', parseApiError(err).message);
    } finally {
      setMessaging(false);
    }
  };

  const handleWriteReview = () => {
    if (!profile) return;
    if (eligible.length === 1) {
      const engagement = eligible[0];
      navigation.navigate('WriteReview', {
        revieweeId: profile.id,
        revieweeName: profile.fullName,
        relatedType: engagement.relatedType,
        relatedId: engagement.relatedId,
      });
      return;
    }
    // Multiple eligible engagements with the same person - let them pick which one it's for.
    const engagementButtons: { text: string; onPress: () => void }[] = eligible.map((e) => ({
      text: e.relatedType === 'task' ? 'A completed task' : 'A rental/barter deal',
      onPress: () =>
        navigation.navigate('WriteReview', {
          revieweeId: profile.id,
          revieweeName: profile.fullName,
          relatedType: e.relatedType,
          relatedId: e.relatedId,
        }),
    }));
    Alert.alert('Which one is this review for?', undefined, [
      ...engagementButtons,
      { text: 'Cancel', onPress: () => {} },
    ]);
  };

  const handleReport = () => {
    if (!profile) return;
    navigation.navigate('ReportUser', { reportedUserId: profile.id, reportedUserName: profile.fullName });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        </View>
      </View>
    );
  }

  const avatarUri = profile.avatarUrl ? `${API_URL}${profile.avatarUrl}` : undefined;
  const memberSinceYear = new Date(profile.memberSince).getFullYear();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {isSelf ? (
          <View style={styles.iconButton} />
        ) : (
          <TouchableOpacity style={styles.iconButton} onPress={handleReport}>
            <Ionicons name="flag-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Avatar source={avatarUri} name={profile.fullName} size="xl" />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.fullName}</Text>
            {profile.adminVerified && (
              <View style={styles.verifiedPill}>
                <Ionicons name="shield-checkmark" size={14} color={colors.textInverse} />
                <Text style={styles.verifiedPillText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.roleLine}>
            {profile.role === 'both' ? 'Poster & Tasker' : profile.role === 'poster' ? 'Poster' : 'Tasker'} · Member since {memberSinceYear}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StarRow rating={profile.averageRating} size={16} />
              <Text style={styles.statLabel}>
                {profile.reviewCount > 0
                  ? `${profile.averageRating.toFixed(1)} (${profile.reviewCount} review${profile.reviewCount === 1 ? '' : 's'})`
                  : 'No reviews yet'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.completedTasksCount}</Text>
              <Text style={styles.statLabel}>Jobs completed</Text>
            </View>
          </View>

          {!isSelf && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.messageButton} onPress={handleMessage} disabled={messaging}>
                {messaging ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.textInverse} />
                    <Text style={styles.messageButtonText}>Message</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewButton, eligible.length === 0 && styles.reviewButtonDisabled]}
                onPress={handleWriteReview}
                disabled={eligible.length === 0}
              >
                <Ionicons
                  name="star-outline"
                  size={18}
                  color={eligible.length === 0 ? colors.textTertiary : colors.primary}
                />
                <Text style={[styles.reviewButtonText, eligible.length === 0 && styles.reviewButtonTextDisabled]}>
                  Write a Review
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {profile.specializations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specializations</Text>
            <View style={styles.chipsRow}>
              {profile.specializations.map((id) => (
                <View key={id} style={styles.chip}>
                  <Text style={styles.chipText}>{specializationLabel(id)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {profile.availability ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <Text style={styles.bioText}>{profile.availability}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
          </Text>
          {reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="star-outline" size={28} color={colors.textTertiary} />
              <Text style={styles.emptyReviewsText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map((review) => {
              const reviewerAvatar = review.reviewer?.avatarUrl ? `${API_URL}${review.reviewer.avatarUrl}` : undefined;
              return (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Avatar source={reviewerAvatar} name={review.reviewer?.fullName} size="sm" />
                    <View style={styles.reviewHeaderText}>
                      <Text style={styles.reviewerName}>{review.reviewer?.fullName ?? 'Someone'}</Text>
                      <StarRow rating={review.rating} />
                    </View>
                    <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                  <Text style={styles.reviewContext}>
                    {review.relatedType === 'task' ? 'From a completed task' : 'From a rental/barter deal'}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.textSecondary, fontSize: typography.fontSize.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  avatarWrap: { marginBottom: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  verifiedPillText: { color: colors.textInverse, fontSize: typography.fontSize.xs, fontWeight: '700' },
  roleLine: { color: colors.textSecondary, fontSize: typography.fontSize.sm, marginTop: 4, marginBottom: spacing.md },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.md },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  messageButtonText: { color: colors.textInverse, fontWeight: '600', fontSize: typography.fontSize.sm },
  reviewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  reviewButtonDisabled: { borderColor: colors.border },
  reviewButtonText: { color: colors.primary, fontWeight: '600', fontSize: typography.fontSize.sm },
  reviewButtonTextDisabled: { color: colors.textTertiary },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  bioText: { fontSize: typography.fontSize.base, color: colors.textSecondary, lineHeight: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: `${colors.primary}12`,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipText: { color: colors.primary, fontSize: typography.fontSize.sm, fontWeight: '600' },
  emptyReviews: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyReviewsText: { color: colors.textTertiary, fontSize: typography.fontSize.sm },
  reviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewHeaderText: { flex: 1, gap: 3 },
  reviewerName: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  reviewDate: { fontSize: typography.fontSize.xs, color: colors.textTertiary },
  reviewComment: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 19 },
  reviewContext: { fontSize: typography.fontSize.xs, color: colors.textTertiary, marginTop: spacing.xs, fontStyle: 'italic' },
});

export default UserProfileScreen;
