import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Animation values
  const logoAnim = useRef(new Animated.Value(100)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Logo slides up and fades in
    Animated.parallel([
      Animated.timing(logoAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Then content fades in
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Finally buttons slide up and fade in
        Animated.parallel([
          Animated.timing(buttonsOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(buttonsTranslate, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      {/* Top decorative accent */}
      <View style={styles.accentCircle} />
      
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Animated.View 
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoAnim }],
            }
          ]}
        >
          <Image
            source={require('../../../assets/logo hustlehub.jpg')}
            style={styles.logo}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.contentSection, { opacity: contentOpacity }]}>
        <Text style={styles.appName}>HustleHub</Text>
        <Text style={styles.tagline}>
          Your campus marketplace for tasks, services & rentals
        </Text>
      </Animated.View>

      {/* Buttons */}
      <Animated.View 
        style={[
          styles.buttonsSection, 
          { 
            paddingBottom: insets.bottom + spacing.xl,
            opacity: buttonsOpacity,
            transform: [{ translateY: buttonsTranslate }],
          }
        ]}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.9}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By continuing, you agree to our{' '}
          <Text style={styles.linkText}>Terms</Text> &{' '}
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  accentCircle: {
    position: 'absolute',
    top: -height * 0.15,
    right: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: `${colors.primary}08`,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsSection: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  linkText: {
    color: colors.primary,
  },
});

export default WelcomeScreen;
