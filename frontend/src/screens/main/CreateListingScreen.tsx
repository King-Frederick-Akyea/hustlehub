// src/screens/main/CreateListingScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Modal,
  Switch,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { createListing, uploadListingImage, ListingType } from '../../services/rentalService';
import { parseApiError } from '../../api/errors';
import type { ScreenProps } from '../../navigation/types';

const MAX_PHOTOS = 6;

const STEPS = [
  { id: 0, title: 'What are you posting?', subtitle: 'Choose a listing type' },
  { id: 1, title: 'Describe it', subtitle: 'Be clear and detailed' },
  { id: 2, title: 'Add photos', subtitle: 'Listings with photos get more offers' },
  { id: 3, title: 'Terms', subtitle: 'Set your price or trade terms' },
  { id: 4, title: 'Review & post', subtitle: 'Check everything is correct' },
];

const LISTING_TYPES: { id: ListingType; label: string; description: string; icon: string }[] = [
  {
    id: 'rental',
    label: 'Rental',
    description: 'Rent out an item for cash, a trade, or either',
    icon: 'cube-outline',
  },
  {
    id: 'barter',
    label: 'Barter',
    description: 'Trade a service or item, no cash involved',
    icon: 'swap-horizontal',
  },
];

const CreateListingScreen = ({ navigation }: ScreenProps<'CreateListing'>) => {
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<ListingType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Rental-specific
  const [dailyRate, setDailyRate] = useState('');
  const [barterAccepted, setBarterAccepted] = useState(false);
  const [rentalSeeking, setRentalSeeking] = useState('');

  // Barter-specific
  const [offering, setOffering] = useState('');
  const [barterSeeking, setBarterSeeking] = useState('');

  // Photos (uploaded after the listing is created - see handlePost)
  const [photos, setPhotos] = useState<string[]>([]);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [postError, setPostError] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const totalSteps = STEPS.length;

  const parsedRateValue = parseFloat(dailyRate);
  const parsedDailyRate = dailyRate !== '' && !isNaN(parsedRateValue) && parsedRateValue > 0 ? parsedRateValue : null;
  const formatMoney = (value: number) => value.toFixed(2);

  const changeStep = (newStep: number) => {
    if (newStep < 0 || newStep >= totalSteps) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(newStep);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => changeStep(currentStep + 1);
  const goBack = () => changeStep(currentStep - 1);

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return type !== null;
      case 1:
        return title.trim().length >= 2 && description.trim().length >= 10;
      case 2:
        return true; // Photos are optional
      case 3:
        if (type === 'rental') {
          const rate = parseFloat(dailyRate);
          const hasRate = !isNaN(rate) && rate > 0;
          const hasBarter = barterAccepted && rentalSeeking.trim() !== '';
          return hasRate || hasBarter;
        }
        if (type === 'barter') {
          return offering.trim() !== '' && barterSeeking.trim() !== '';
        }
        return false;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const addPhoto = async (uri: string) => {
    setPhotos((prev) => (prev.length < MAX_PHOTOS ? [...prev, uri] : prev));
  };

  const pickPhotoFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to add pictures.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      await addPhoto(result.assets[0].uri);
    }
  };

  const takePhotoForListing = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera to add pictures.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      await addPhoto(result.assets[0].uri);
    }
  };

  const showAddPhotoOptions = () => {
    Alert.alert('Add a Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhotoForListing },
      { text: 'Choose from Gallery', onPress: pickPhotoFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const handlePost = async () => {
    if (!isStepValid() || !type) return;
    setLoading(true);
    setPostError('');
    try {
      const rate = parseFloat(dailyRate);
      const hasRate = !isNaN(rate) && rate > 0;

      const listing =
        type === 'rental'
          ? await createListing({
              type: 'rental',
              title: title.trim(),
              description: description.trim(),
              dailyRate: hasRate ? rate : undefined,
              barterAccepted,
              seeking: barterAccepted && rentalSeeking.trim() !== '' ? rentalSeeking.trim() : undefined,
            })
          : await createListing({
              type: 'barter',
              title: title.trim(),
              description: description.trim(),
              barterAccepted: true,
              offering: offering.trim(),
              seeking: barterSeeking.trim(),
            });

      // Uploaded sequentially, after the listing exists - the listing itself is already live at
      // this point (a failed photo upload shouldn't be treated as the whole post failing).
      for (const uri of photos) {
        try {
          await uploadListingImage(listing.id, uri);
        } catch (err) {
          // Best-effort: the listing is posted either way, so don't block success on one photo failing.
        }
      }

      setSuccessModalVisible(true);
    } catch (err) {
      setPostError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[0].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[0].subtitle}</Text>
            {LISTING_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeOptionCard, type === t.id && styles.typeOptionCardActive]}
                onPress={() => setType(t.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.typeOptionIcon,
                  { backgroundColor: type === t.id ? `${colors.primary}15` : colors.surfaceSecondary },
                ]}>
                  <Ionicons
                    name={t.icon as any}
                    size={28}
                    color={type === t.id ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.typeOptionText}>
                  <Text style={[styles.typeOptionLabel, type === t.id && styles.typeOptionLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.typeOptionDescription}>{t.description}</Text>
                </View>
                {type === t.id && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[1].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[1].subtitle}</Text>
            <Text style={styles.fieldLabel}>Title</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={type === 'barter' ? 'e.g. Math Tutoring for Web Dev Help' : 'e.g. Canon DSLR Camera'}
                placeholderTextColor={colors.placeholder}
                value={title}
                onChangeText={setTitle}
                maxLength={150}
              />
            </View>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe what you're posting in detail..."
              placeholderTextColor={colors.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {description.length > 0 && description.length < 10 && (
              <Text style={styles.hintText}>Minimum 10 characters</Text>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[2].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[2].subtitle}</Text>
            <View style={styles.photoGrid}>
              {photos.map((uri) => (
                <View key={uri} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity style={styles.photoRemoveButton} onPress={() => removePhoto(uri)}>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                  {photos[0] === uri && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>Cover</Text>
                    </View>
                  )}
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={styles.addPhotoButton} onPress={showAddPhotoOptions}>
                  <Ionicons name="camera-outline" size={26} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.hintTextMuted}>
              {photos.length}/{MAX_PHOTOS} photos {photos.length > 0 ? '· First photo is the cover image' : '· Optional, but listings with photos get more offers'}
            </Text>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[3].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[3].subtitle}</Text>
            {type === 'rental' ? (
              <>
                <Text style={styles.fieldLabel}>Daily Rate (GH¢)</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencyPrefix}>GH¢</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00 (leave blank if barter-only)"
                    placeholderTextColor={colors.placeholder}
                    value={dailyRate}
                    onChangeText={setDailyRate}
                    keyboardType="decimal-pad"
                  />
                </View>
                {parsedDailyRate != null && (
                  <Text style={styles.holdNoticeText}>
                    Renters who pay cash will have GH₵{formatMoney(parsedDailyRate)}×days held until you accept their offer.
                  </Text>
                )}

                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Also accept a barter trade instead of cash</Text>
                    <Text style={styles.switchHint}>Let renters offer a trade instead of paying</Text>
                  </View>
                  <Switch
                    value={barterAccepted}
                    onValueChange={setBarterAccepted}
                    trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                    thumbColor={barterAccepted ? colors.primary : '#FFFFFF'}
                  />
                </View>

                {barterAccepted && (
                  <>
                    <Text style={styles.fieldLabel}>What would you want in trade?</Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="e.g. Help moving furniture, or a book you need"
                      placeholderTextColor={colors.placeholder}
                      value={rentalSeeking}
                      onChangeText={setRentalSeeking}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </>
                )}

                {!isStepValid() && (
                  <Text style={styles.hintText}>
                    Set a daily rate above GH¢0, or turn on barter and describe what you want in trade.
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>What can you offer?</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g. 2 hours of Calculus tutoring"
                  placeholderTextColor={colors.placeholder}
                  value={offering}
                  onChangeText={setOffering}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Text style={styles.fieldLabel}>What do you want in return?</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g. Help with HTML/CSS website"
                  placeholderTextColor={colors.placeholder}
                  value={barterSeeking}
                  onChangeText={setBarterSeeking}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </>
            )}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[4].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[4].subtitle}</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Ionicons
                  name={type === 'barter' ? 'swap-horizontal' : 'cube-outline'}
                  size={20}
                  color={colors.primary}
                  style={styles.summaryIcon}
                />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Type</Text>
                  <Text style={styles.summaryValue}>{type === 'barter' ? 'Barter' : 'Rental'}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="create-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Title</Text>
                  <Text style={styles.summaryValue}>{title}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Description</Text>
                  <Text style={styles.summaryValue}>{description}</Text>
                </View>
              </View>
              {type === 'rental' ? (
                <>
                  <View style={styles.summaryRow}>
                    <Ionicons name="cash-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>Daily Rate</Text>
                      <Text style={[styles.summaryValue, styles.budgetValue]}>
                        {parseFloat(dailyRate) > 0 ? `GH¢ ${dailyRate}` : 'Not set (barter only)'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowLast]}>
                    <Ionicons name="swap-horizontal" size={20} color={colors.primary} style={styles.summaryIcon} />
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>Barter</Text>
                      <Text style={styles.summaryValue}>
                        {barterAccepted ? `Also accepted — wants: ${rentalSeeking}` : 'Not accepted'}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.summaryRow}>
                    <Ionicons name="gift-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>Offering</Text>
                      <Text style={styles.summaryValue}>{offering}</Text>
                    </View>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowLast]}>
                    <Ionicons name="hand-left-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>Seeking</Text>
                      <Text style={styles.summaryValue}>{barterSeeking}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Listing</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentStep + 1) / totalSteps) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentStep + 1} of {totalSteps}</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
          >
            {renderStepContent(currentStep)}
          </ScrollView>
        </Animated.View>

        {postError ? (
          <Text style={[styles.hintText, { paddingHorizontal: spacing.lg }]}>{postError}</Text>
        ) : null}

        <View style={[styles.footer, { paddingBottom: (insets.bottom || spacing.sm) }]}>
          {currentStep > 0 && currentStep < totalSteps - 1 && (
            <TouchableOpacity style={styles.backFooterButton} onPress={goBack}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
              <Text style={styles.backFooterText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {currentStep < totalSteps - 1 ? (
            <TouchableOpacity
              style={[styles.nextButton, !isStepValid() && styles.nextButtonDisabled]}
              onPress={goNext}
              disabled={!isStepValid()}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.postButton, (!isStepValid() || loading) && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={!isStepValid() || loading}
            >
              <Text style={styles.postButtonText}>{loading ? 'Posting...' : 'Post Listing'}</Text>
              {!loading && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          )}
        </View>

        {/* Success Modal */}
        <Modal
          transparent
          visible={successModalVisible}
          animationType="fade"
          onRequestClose={() => {
            setSuccessModalVisible(false);
            navigation.goBack();
          }}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="checkmark-circle" size={50} color={colors.success} />
                  </View>
                  <Text style={styles.modalTitle}>Listing Posted!</Text>
                  <Text style={styles.modalMessage}>
                    Your listing is now live. Other students can view it and make you an offer.
                  </Text>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setSuccessModalVisible(false);
                      navigation.goBack();
                    }}
                  >
                    <Text style={styles.modalButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  stepContainer: { flex: 1, paddingTop: spacing.md },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  typeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeOptionCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  typeOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  typeOptionText: {
    flex: 1,
  },
  typeOptionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  typeOptionLabelActive: {
    color: colors.primary,
  },
  typeOptionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 100,
    marginBottom: spacing.md,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  hintTextMuted: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoThumbWrap: {
    position: 'relative',
    width: 96,
    height: 96,
  },
  photoThumb: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  addPhotoButton: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  holdNoticeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSecondary,
  },
  currencyPrefix: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.base,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  switchHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  // Summary card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryIcon: {
    marginRight: spacing.md,
    width: 24,
    textAlign: 'center',
    marginTop: 2,
  },
  summaryContent: {
    flex: 1,
    flexShrink: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flexWrap: 'wrap',
  },
  budgetValue: {
    fontWeight: '700',
    color: colors.primary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  backFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  backFooterText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Success modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.base,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateListingScreen;
