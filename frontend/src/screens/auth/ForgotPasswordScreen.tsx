import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../api/errors';

const ForgotPasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [devResetToken, setDevResetToken] = useState<string | undefined>(undefined);

  // Animation
  const successAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  const handleSendReset = async () => {
    if (!email) return;

    setError('');
    setLoading(true);
    Keyboard.dismiss();

    try {
      const result = await forgotPassword(email.trim());
      setDevResetToken(result.devResetToken);
      setSent(true);

      // Animate success state
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setSent(false);
    setEmail('');
    successAnim.setValue(0);
    checkScale.setValue(0);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {!sent ? (
            // Email Input State
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
                </View>
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                  No worries! Enter your email and we'll send you a reset link.
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="your@university.edu"
                      placeholderTextColor={colors.placeholder}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoFocus
                    />
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.resetButton, loading && styles.resetButtonLoading]}
                  onPress={handleSendReset}
                  disabled={loading || !email}
                  activeOpacity={0.9}
                >
                  <Text style={styles.resetButtonText}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Success State
            <Animated.View 
              style={[
                styles.successContainer,
                { opacity: successAnim }
              ]}
            >
              <Animated.View 
                style={[
                  styles.successIconContainer,
                  { transform: [{ scale: checkScale }] }
                ]}
              >
                <Ionicons name="mail-outline" size={40} color={colors.primary} />
              </Animated.View>
              
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successSubtitle}>
                We've sent a password reset link to{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              {devResetToken ? (
                <TouchableOpacity
                  style={styles.devResetButton}
                  onPress={() => navigation.navigate('ResetPassword', { email, devToken: devResetToken })}
                  activeOpacity={0.9}
                >
                  <Text style={styles.devResetButtonText}>Enter my reset code (dev)</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.openEmailButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.9}
              >
                <Text style={styles.openEmailButtonText}>Back to Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleTryAgain}
              >
                <Text style={styles.resendButtonText}>
                  Didn't receive the email? <Text style={styles.resendLink}>Try again</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  form: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  input: {
    paddingVertical: 16,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  resetButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  resetButtonLoading: {
    opacity: 0.8,
  },
  resetButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  // Success State
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['3xl'],
  },
  successIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  emailHighlight: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  openEmailButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: spacing['3xl'],
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  openEmailButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resendButton: {
    paddingVertical: spacing.md,
  },
  resendButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  devResetButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  devResetButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default ForgotPasswordScreen;
