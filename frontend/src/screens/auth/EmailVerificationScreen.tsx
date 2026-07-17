import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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

const EmailVerificationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, verifyEmail, resendVerification } = useAuth();
  const email = user?.email ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const inputRefs = useRef([]);

  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const lastFilledIndex = Math.min(index + pastedOtp.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return;

    setError('');
    setLoading(true);
    try {
      await verifyEmail(otpString);
      navigation.navigate('StudentIDUpload');
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendMessage('');
    setResending(true);
    try {
      const result = await resendVerification();
      setResendMessage(result.devVerificationCode ? `Dev code: ${result.devVerificationCode}` : result.message);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="mail-unread-outline" size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{' '}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        {/* OTP Inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {resendMessage ? <Text style={styles.resendMessageText}>{resendMessage}</Text> : null}

          {/* Resend */}
          <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resending}>
            <Text style={styles.resendText}>Didn't get the code? </Text>
            <Text style={styles.resendLink}>{resending ? 'Sending...' : 'Resend'}</Text>
          </TouchableOpacity>
        </View>

        {/* Verify Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonLoading]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
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
    marginBottom: spacing['2xl'],
  },
  emailText: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  otpInputFilled: {
    backgroundColor: `${colors.primary}10`,
  },
  resendButton: {
    flexDirection: 'row',
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  resendMessageText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.lg,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  verifyButtonLoading: {
    opacity: 0.8,
  },
  verifyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EmailVerificationScreen;
