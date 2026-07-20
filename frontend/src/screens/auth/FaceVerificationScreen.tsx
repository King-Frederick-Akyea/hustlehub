import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Animated,
  Image,
  ImageStyle,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../api/errors';
import type { ScreenProps } from '../../navigation/types';

const FaceVerificationScreen = ({ navigation }: ScreenProps<'FaceVerification'>) => {
  const insets = useSafeAreaInsets();
  const { uploadFacePhoto } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [instruction, setInstruction] = useState('Position your face in the circle');
  const [showSuccess, setShowSuccess] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if we need to show permission modal
    if (permission && !permission.granted && !permission.canAskAgain === false) {
      setShowPermissionModal(true);
      animateModalIn();
    }
  }, [permission]);

  useEffect(() => {
    // Pulse animation for the circle border
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const animateModalIn = () => {
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateModalOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleAllowCamera = async () => {
    animateModalOut(async () => {
      setShowPermissionModal(false);
      await requestPermission();
    });
  };

  const handleDenyCamera = () => {
    animateModalOut(() => {
      setShowPermissionModal(false);
      navigation.goBack();
    });
  };

  const handleStartVerification = async () => {
    if (!cameraRef.current) return;

    setVerifying(true);
    setInstruction('Hold still...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      setCapturedImage(photo.uri);

      setInstruction('Analyzing face...');
      await uploadFacePhoto(photo.uri);

      setInstruction('Verified!');
      setShowSuccess(true);
    } catch (error) {
      setCapturedImage(null);
      setVerifying(false);
      setInstruction(parseApiError(error).message || 'Something went wrong. Please try again.');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setVerifying(false);
    setInstruction('Position your face in the circle');
  };

  const handleContinue = () => {
    setShowSuccess(false);
    navigation.navigate('VerificationSuccess');
  };

  // Show nothing while permission status is loading
  if (!permission) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Custom Permission Modal */}
      <Modal
        visible={showPermissionModal}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.permissionModalOverlay}>
          <Animated.View 
            style={[
              styles.permissionModalContent,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              }
            ]}
          >
            <View style={styles.permissionIconContainer}>
              <Ionicons name="scan" size={40} color={colors.primary} />
            </View>
            <Text style={styles.permissionTitle}>Face Verification</Text>
            <Text style={styles.permissionDescription}>
              HustleHub needs access to your camera to verify your identity and keep the community safe.
            </Text>
            <TouchableOpacity 
              style={styles.permissionAllowButton}
              onPress={handleAllowCamera}
              activeOpacity={0.9}
            >
              <Text style={styles.permissionAllowButtonText}>Allow Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.permissionDenyButton}
              onPress={handleDenyCamera}
              activeOpacity={0.9}
            >
              <Text style={styles.permissionDenyButtonText}>Not Now</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Face Detection Area */}
      <View style={styles.cameraContainer}>
        <Animated.View 
          style={[
            styles.faceCircle,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={styles.faceCircleInner}>
            {capturedImage ? (
              // Show captured image
              <Image source={{ uri: capturedImage }} style={styles.capturedFace} />
            ) : permission.granted ? (
              // Show front camera
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
              />
            ) : (
              // Permission denied
              <View style={styles.noCameraContainer}>
                <Ionicons name="camera-outline" size={60} color="rgba(255,255,255,0.4)" />
                <TouchableOpacity 
                  style={styles.enableCameraButton}
                  onPress={() => {
                    setShowPermissionModal(true);
                    animateModalIn();
                  }}
                >
                  <Text style={styles.enableCameraText}>Enable Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Instruction text below the circle */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instruction}>{instruction}</Text>
        {verifying && (
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <Ionicons 
                name={capturedImage ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={capturedImage ? colors.success : 'rgba(255,255,255,0.5)'} 
              />
              <Text style={styles.stepText}>Photo captured</Text>
            </View>
            <View style={styles.stepItem}>
              <Ionicons 
                name={showSuccess ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={showSuccess ? colors.success : 'rgba(255,255,255,0.5)'} 
              />
              <Text style={styles.stepText}>Identity verified</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        {capturedImage && !showSuccess ? (
          // Retake option while verifying
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetake}
          >
            <Ionicons name="refresh" size={20} color={colors.textInverse} />
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        ) : !verifying && permission.granted && (
          // Start button
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartVerification}
          >
            <Text style={styles.startButtonText}>Capture & Verify</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Success Modal/Overlay Pop-up */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, { paddingBottom: insets.bottom + spacing.xl }]}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark" size={48} color={colors.textInverse} />
            </View>
            <Text style={styles.successTitle}>Verification Complete!</Text>
            <Text style={styles.successSubtitle}>Your identity has been verified.</Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  // Permission Modal styles
  permissionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionModalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  permissionAllowButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  permissionAllowButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permissionDenyButton: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  permissionDenyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  faceCircleInner: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  capturedFace: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  noCameraContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableCameraButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  enableCameraText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  // Instruction styles
  instructionContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  instruction: {
    fontSize: typography.fontSize.lg,
    color: colors.textInverse,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.lg,
  },
  stepsContainer: {
    alignItems: 'flex-start',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  stepText: {
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
    marginLeft: spacing.sm,
    opacity: 0.8,
  },
  // Footer styles
  footer: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: spacing['3xl'],
    alignItems: 'center',
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    gap: spacing.sm,
  },
  retakeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.textInverse,
  },
  // Success Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  successModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing['2xl'],
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: spacing['4xl'],
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FaceVerificationScreen;
