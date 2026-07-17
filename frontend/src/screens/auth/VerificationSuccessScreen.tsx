import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';

const VerificationSuccessScreen = () => {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    // No manual navigation: this flips RootNavigator over to the Main stack.
    completeOnboarding();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing['3xl'] }]}>
      {/* Success Icon */}
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.iconContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.iconInner}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Your account has been verified. Start exploring tasks, earning money, and connecting with students.
          </Text>

          {/* Verification badges */}
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.badgeText}>Email verified</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.badgeText}>ID verified</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.badgeText}>Face verified</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  badges: {
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}10`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: '500',
  },
  footer: {
    paddingTop: spacing.lg,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default VerificationSuccessScreen;
