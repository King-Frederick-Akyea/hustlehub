// src/screens/main/SuspendedScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';

/**
 * Rendered in place of the entire Main stack by RootNavigator whenever
 * user.accountStatus === 'suspended' - there is deliberately no way to navigate out of this
 * screen except logging out, since the whole point is blocking app access.
 */
const SuspendedScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.iconCircle}>
        <Ionicons name="lock-closed" size={40} color={colors.error} />
      </View>
      <Text style={styles.title}>Account Suspended</Text>
      <Text style={styles.subtitle}>
        Your HustleHub account has been suspended and you no longer have access to the app.
      </Text>

      <View style={styles.reasonCard}>
        <Text style={styles.reasonLabel}>Reason given by our team</Text>
        <Text style={styles.reasonText}>
          {user?.suspensionReason || 'No reason was provided.'}
        </Text>
      </View>

      <Text style={styles.footnote}>
        If you believe this was a mistake, contact HustleHub support and reference your account
        email ({user?.email}).
      </Text>

      <Button title="Log Out" variant="outline" onPress={() => logout()} style={styles.logoutButton} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.xl,
  },
  reasonCard: {
    width: '100%',
    backgroundColor: colors.errorLight,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  reasonLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  footnote: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  logoutButton: {
    width: '100%',
  },
});

export default SuspendedScreen;
