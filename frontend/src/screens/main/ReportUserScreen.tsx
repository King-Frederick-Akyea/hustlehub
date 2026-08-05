// src/screens/main/ReportUserScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import Button from '../../components/Button';
import { reportUser, REPORT_REASON_OPTIONS, ReportReasonCategory } from '../../services/reportService';
import { parseApiError } from '../../api/errors';
import type { ScreenProps } from '../../navigation/types';

const ReportUserScreen = ({ navigation, route }: ScreenProps<'ReportUser'>) => {
  const { reportedUserId, reportedUserName } = route.params;
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReasonCategory | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason');
      return;
    }
    if (!description.trim()) {
      setError('Please describe what happened');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await reportUser({ reportedUserId, reasonCategory: reason, description: description.trim() });
      Alert.alert(
        'Report submitted',
        'Thanks for letting us know. Our team will review this and take action if needed.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
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
        <Text style={styles.headerTitle}>Report User</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Report {reportedUserName}</Text>
        <Text style={styles.hint}>
          Reports are reviewed by the HustleHub team. Only report genuine issues — false reports can
          affect your own account standing.
        </Text>

        <Text style={styles.label}>Reason</Text>
        <View style={styles.reasonList}>
          {REPORT_REASON_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.reasonRow, reason === option.id && styles.reasonRowActive]}
              onPress={() => setReason(option.id)}
            >
              <View style={[styles.radio, reason === option.id && styles.radioActive]}>
                {reason === option.id && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.reasonText, reason === option.id && styles.reasonTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>What happened?</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={5}
          maxLength={2000}
          textAlignVertical="top"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button title="Submit Report" variant="danger" onPress={handleSubmit} loading={submitting} />
      </ScrollView>
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
  content: { padding: spacing.lg },
  subtitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  hint: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 18 },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  reasonList: { marginBottom: spacing.lg, gap: spacing.sm },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  reasonRowActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  reasonText: { fontSize: typography.fontSize.base, color: colors.textPrimary },
  reasonTextActive: { color: colors.primary, fontWeight: '600' },
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

export default ReportUserScreen;
