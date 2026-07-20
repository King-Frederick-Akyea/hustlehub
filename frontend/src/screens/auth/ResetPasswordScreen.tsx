import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../api/errors';
import type { ScreenProps } from '../../navigation/types';

const ResetPasswordScreen = ({ navigation, route }: ScreenProps<'ResetPassword'>) => {
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();
  const [token, setToken] = useState(route?.params?.devToken ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canSubmit = token && newPassword && confirmPassword && !loading;

  const handleReset = async () => {
    if (!canSubmit) return;
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);
      setDone(true);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, styles.successContainer, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
        </View>
        <Text style={styles.title}>Password reset</Text>
        <Text style={styles.subtitle}>You can now sign in with your new password.</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
          activeOpacity={0.9}
        >
          <Text style={styles.resetButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>Enter the code you received and choose a new password.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Reset code</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Paste your reset code"
                placeholderTextColor={colors.placeholder}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>New password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor={colors.placeholder}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>At least 8 characters, with a letter and a number</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Confirm password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.resetButton, !canSubmit && styles.resetButtonDisabled]}
            onPress={handleReset}
            disabled={!canSubmit}
            activeOpacity={0.9}
          >
            <Text style={styles.resetButtonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  resetButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIconContainer: {
    marginBottom: spacing.xl,
  },
});

export default ResetPasswordScreen;
