// src/screens/main/WriteReviewScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import Button from '../../components/Button';
import { createReview } from '../../services/reviewService';
import { parseApiError } from '../../api/errors';
import type { ScreenProps } from '../../navigation/types';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Below average',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

const WriteReviewScreen = ({ navigation, route }: ScreenProps<'WriteReview'>) => {
  const { revieweeId, revieweeName, relatedType, relatedId } = route.params;
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await createReview({ revieweeId, relatedType, relatedId, rating, comment: comment.trim() || undefined });
      Alert.alert('Review submitted', `Thanks for reviewing ${revieweeName}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>How was your experience with {revieweeName}?</Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Ionicons
                name={rating >= n ? 'star' : 'star-outline'}
                size={40}
                color={colors.accent}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>}

        <Text style={styles.label}>Comment (optional)</Text>
        <TextInput
          style={styles.textArea}
          value={comment}
          onChangeText={setComment}
          placeholder="Share details about your experience..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={5}
          maxLength={1000}
          textAlignVertical="top"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button title="Submit Review" onPress={handleSubmit} loading={submitting} disabled={rating === 0} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  content: { padding: spacing.lg, flex: 1 },
  subtitle: { fontSize: typography.fontSize.base, color: colors.textPrimary, marginBottom: spacing.lg, textAlign: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  star: { marginHorizontal: 2 },
  ratingLabel: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  textArea: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.error, fontSize: typography.fontSize.sm, marginBottom: spacing.md, textAlign: 'center' },
});

export default WriteReviewScreen;
