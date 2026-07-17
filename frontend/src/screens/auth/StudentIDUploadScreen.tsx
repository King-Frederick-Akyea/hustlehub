import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  Animated,
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

const StudentIDUploadScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { uploadStudentId } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef(null);
  
  // Animation for modal
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if we need to show permission modal
    if (permission && !permission.granted && !permission.canAskAgain === false) {
      setShowPermissionModal(true);
      animateModalIn();
    }
  }, [permission]);

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

  const animateModalOut = (callback) => {
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

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      setCapturedImage(photo.uri);
    } catch (error) {
      console.log('Error capturing photo:', error);
    }
    setLoading(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError('');
  };

  const handleContinue = async () => {
    if (!capturedImage) return;
    setError('');
    setUploading(true);
    try {
      await uploadStudentId(capturedImage);
      navigation.navigate('FaceVerification');
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setUploading(false);
    }
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
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              }
            ]}
          >
            <View style={styles.modalIconContainer}>
              <Ionicons name="camera" size={40} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Camera Access</Text>
            <Text style={styles.modalDescription}>
              HustleHub needs access to your camera to capture your student ID for verification.
            </Text>
            <TouchableOpacity 
              style={styles.modalAllowButton}
              onPress={handleAllowCamera}
              activeOpacity={0.9}
            >
              <Text style={styles.modalAllowButtonText}>Allow Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalDenyButton}
              onPress={handleDenyCamera}
              activeOpacity={0.9}
            >
              <Text style={styles.modalDenyButtonText}>Not Now</Text>
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
        <Text style={styles.headerTitle}>Upload Student ID</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Instruction */}
      <Text style={styles.instruction}>
        {error
          ? error
          : capturedImage
          ? 'Review your photo'
          : 'Capture a clear photo of your student ID card'}
      </Text>

      {/* Camera or Preview */}
      <View style={styles.cameraContainer}>
        {capturedImage ? (
          // Show captured image preview
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.preview} />
          </View>
        ) : permission.granted ? (
          // Show camera
          <View style={styles.viewfinder}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="back"
            />
            {/* ID Card shaped bounding box overlay */}
            <View style={styles.idCardOverlay}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <Ionicons name="card-outline" size={80} color="rgba(255,255,255,0.5)" />
              <Text style={styles.overlayText}>Position ID card here</Text>
            </View>
          </View>
        ) : (
          // Permission denied state
          <View style={styles.viewfinder}>
            <View style={styles.permissionDenied}>
              <Ionicons name="camera-outline" size={60} color="rgba(255,255,255,0.5)" />
              <Text style={styles.permissionDeniedText}>
                Camera access is required
              </Text>
              <TouchableOpacity 
                style={styles.retryPermissionButton}
                onPress={() => {
                  setShowPermissionModal(true);
                  animateModalIn();
                }}
              >
                <Text style={styles.retryPermissionText}>Enable Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        {capturedImage ? (
          // Preview actions
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              activeOpacity={0.9}
              disabled={uploading}
            >
              <Ionicons name="refresh" size={24} color={colors.textInverse} />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.continueButton, uploading && styles.captureButtonDisabled]}
              onPress={handleContinue}
              activeOpacity={0.9}
              disabled={uploading}
            >
              <Text style={styles.continueButtonText}>{uploading ? 'Uploading...' : 'Continue'}</Text>
              {!uploading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        ) : (
          // Capture button
          <>
            <TouchableOpacity
              style={[styles.captureButton, !permission.granted && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={loading || !permission.granted}
            >
              <View style={styles.captureButtonInner}>
                {loading ? (
                  <Ionicons name="hourglass" size={32} color={colors.backgroundDark} />
                ) : (
                  <Ionicons name="camera" size={32} color={colors.backgroundDark} />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.captureLabel}>
              {loading ? 'Capturing...' : 'Capture ID'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalAllowButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalAllowButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalDenyButton: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  modalDenyButtonText: {
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
  instruction: {
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    opacity: 0.9,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  viewfinder: {
    width: '100%',
    aspectRatio: 1.6,
    backgroundColor: colors.charcoal,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  idCardOverlay: {
    position: 'absolute',
    width: '85%',
    height: '70%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.textInverse,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.textInverse,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.textInverse,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.textInverse,
    borderBottomRightRadius: 12,
  },
  overlayText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
  },
  // Permission denied
  permissionDenied: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionDeniedText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryPermissionButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryPermissionText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  // Preview styles
  previewContainer: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.charcoal,
    borderRadius: 14,
    gap: spacing.sm,
  },
  retakeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textInverse,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    gap: spacing.sm,
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Footer styles
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureLabel: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    marginTop: spacing.md,
  },
});

export default StudentIDUploadScreen;
