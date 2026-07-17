// src/screens/main/EditProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../api/errors';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, updateProfile, uploadAvatar } = useAuth();
  const [name, setName] = useState(user?.fullName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const uploadPickedAvatar = async (uri: string) => {
    setAvatarImage(uri);
    setError('');
    setAvatarUploading(true);
    try {
      await uploadAvatar(uri);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadPickedAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadPickedAvatar(result.assets[0].uri);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Change Avatar',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await updateProfile({ fullName: name.trim(), bio: bio.trim() });
      navigation.goBack();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const existingAvatarUri = user?.avatarUrl ? `${API_URL}${user.avatarUrl}` : null;
  const displayedAvatarUri = avatarImage ?? existingAvatarUri;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={showImagePickerOptions}
            style={styles.avatarContainer}
            disabled={avatarUploading}
          >
            {displayedAvatarUri ? (
              <Image source={{ uri: displayedAvatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.changeAvatarButton}>
              {avatarUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.changeAvatarHint}>
            {avatarUploading ? 'Uploading photo...' : 'Tap to change photo'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.readOnlyValue}>{user?.email}</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              maxLength={280}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  saveButton: {
    padding: spacing.sm,
    minWidth: 44,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  errorBanner: {
    backgroundColor: `${colors.error}12`,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  changeAvatarHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyValue: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bioInput: {
    minHeight: 80,
  },
});

export default EditProfileScreen;
