// Web fallback — react-native-maps imports React Native internals (codegenNativeCommands) that
// don't exist on web, and Metro would fail to bundle them even behind a runtime Platform.OS
// check (static imports get resolved at bundle time, not runtime). Metro's platform-extension
// resolution picks THIS file for web builds instead, so react-native-maps is never imported here
// at all. Shows origin/destination as "open in Google Maps" links instead of an inline map.
import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import type { LatLng, TaskLocationMapHandle, TaskLocationMapProps } from './TaskLocationMap.types';

const googleMapsUrl = (coord: LatLng) =>
  `https://www.google.com/maps/search/?api=1&query=${coord.latitude},${coord.longitude}`;

const TaskLocationMap = forwardRef<TaskLocationMapHandle, TaskLocationMapProps>(
  ({ origin, destination, isDelivery }, ref) => {
    // The web fallback has no live map to move, so these are no-ops - callers (TaskDetailsScreen)
    // call them the same way regardless of platform, they just have nothing to animate here.
    useImperativeHandle(ref, () => ({
      animateToRegion: () => {},
      fitToCoordinates: () => {},
    }));

    return (
      <View style={styles.container}>
        <Ionicons name="map-outline" size={32} color={colors.textTertiary} />
        <Text style={styles.title}>Map view isn't available on web yet</Text>
        <Text style={styles.subtitle}>Open the location in Google Maps instead:</Text>
        <TouchableOpacity style={styles.link} onPress={() => Linking.openURL(googleMapsUrl(origin))}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.linkText}>{isDelivery ? 'Pickup location' : 'Task location'}</Text>
        </TouchableOpacity>
        {isDelivery && (
          <TouchableOpacity style={styles.link} onPress={() => Linking.openURL(googleMapsUrl(destination))}>
            <Ionicons name="flag-outline" size={16} color={colors.primary} />
            <Text style={styles.linkText}>Dropoff location</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  linkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default TaskLocationMap;
