// src/screens/auth/RegisterScreen.tsx
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
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { links } from '../../constants/links';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../api/errors';
import type { ScreenProps } from '../../navigation/types';

type Role = 'poster' | 'tasker' | 'both';

const RegisterScreen = ({ navigation }: ScreenProps<'Register'>) => {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password || !selectedRole) return;

    setError('');
    setLoading(true);
    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password, role: selectedRole });
      // No manual navigation: becoming authenticated moves RootNavigator to the Verification
      // stack automatically, landing on EmailVerification.
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join the student community</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={colors.placeholder}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Student Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="your@university.edu"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>At least 8 characters, with a letter and a number</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleWrapper}>
            <Text style={styles.inputLabel}>I want to be a</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'poster' && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole('poster')}
              >
                <Ionicons
                  name="create-outline"
                  size={28}
                  color={selectedRole === 'poster' ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.roleLabel,
                  selectedRole === 'poster' && styles.roleLabelActive,
                ]}>
                  Poster
                </Text>
                <Text style={styles.roleDescription}>Post tasks for others</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'tasker' && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole('tasker')}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                  color={selectedRole === 'tasker' ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.roleLabel,
                  selectedRole === 'tasker' && styles.roleLabelActive,
                ]}>
                  Tasker
                </Text>
                <Text style={styles.roleDescription}>Accept and work on tasks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'both' && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole('both')}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={28}
                  color={selectedRole === 'both' ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.roleLabel,
                  selectedRole === 'both' && styles.roleLabelActive,
                ]}>
                  Both
                </Text>
                <Text style={styles.roleDescription}>Post and accept tasks</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text
              style={styles.termsLink}
              onPress={() => WebBrowser.openBrowserAsync(links.terms)}
            >
              Terms
            </Text>{' '}
            and{' '}
            <Text
              style={styles.termsLink}
              onPress={() => WebBrowser.openBrowserAsync(links.privacy)}
            >
              Privacy Policy
            </Text>
          </Text>

          <TouchableOpacity
            style={[
              styles.createButton,
              loading && styles.createButtonLoading,
              (!fullName || !email || !password || !selectedRole) && styles.createButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading || !fullName || !email || !password || !selectedRole}
            activeOpacity={0.9}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
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
  roleWrapper: {
    marginBottom: spacing.lg,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  roleLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  roleLabelActive: {
    color: colors.primary,
  },
  roleDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonLoading: {
    opacity: 0.8,
  },
  createButtonText: {
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
});

export default RegisterScreen;