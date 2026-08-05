// src/screens/main/ImageViewerScreen.tsx
import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import type { ScreenProps } from '../../navigation/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/** Full-screen photo viewer for listing gallery / chat images - opened as a transparent modal (see MainNavigator). */
const ImageViewerScreen = ({ navigation, route }: ScreenProps<'ImageViewer'>) => {
  const { imageUrl, headers } = route.params;
  const insets = useSafeAreaInsets();
  const uri = imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={28} color={colors.textInverse} />
      </TouchableOpacity>
      <Image
        source={{ uri, headers }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  image: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImageViewerScreen;
