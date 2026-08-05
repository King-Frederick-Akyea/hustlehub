// Native (iOS/Android) implementation — see TaskLocationMap.web.tsx for the web fallback.
// Metro picks whichever file matches the current platform automatically; TaskDetailsScreen just
// imports "./TaskLocationMap" and never touches react-native-maps directly, which is what keeps
// that native-only import out of the web bundle entirely (see the .web.tsx file's header comment).
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import type { TaskLocationMapHandle, TaskLocationMapProps } from './TaskLocationMap.types';

const mapStyle: any[] = [];

const CustomMarker = ({ type, label }: { type: 'user' | 'origin' | 'destination'; label?: string }) => (
  <View style={styles.customMarker}>
    <View style={[
      styles.markerContainer,
      type === 'user' && styles.markerUser,
      type === 'origin' && styles.markerOrigin,
      type === 'destination' && styles.markerDestination,
    ]}>
      <Ionicons
        name={type === 'user' ? 'person' : type === 'origin' ? 'location' : 'flag'}
        size={18}
        color="#FFFFFF"
      />
    </View>
    {label && (
      <View style={styles.markerLabel}>
        <Text style={styles.markerLabelText}>{label}</Text>
      </View>
    )}
  </View>
);

const TaskLocationMap = forwardRef<TaskLocationMapHandle, TaskLocationMapProps>(
  ({ origin, destination, userLocation, routeCoordinates, isDelivery }, ref) => {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region, durationMs) => mapRef.current?.animateToRegion(region, durationMs),
      fitToCoordinates: (coordinates, edgePadding) =>
        mapRef.current?.fitToCoordinates(coordinates, { edgePadding, animated: true }),
    }));

    return (
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={mapStyle}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 1 }}>
            <CustomMarker type="user" label="You" />
          </Marker>
        )}
        <Marker coordinate={origin} anchor={{ x: 0.5, y: 1 }}>
          <CustomMarker type="origin" label={isDelivery ? 'Pickup' : 'Task'} />
        </Marker>
        {isDelivery && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }}>
            <CustomMarker type="destination" label="Dropoff" />
          </Marker>
        )}
        {userLocation && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
        {isDelivery && (
          <Polyline
            coordinates={[origin, destination]}
            strokeColor="#4CAF50"
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>
    );
  }
);

const styles = StyleSheet.create({
  customMarker: {
    alignItems: 'center',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerUser: {
    backgroundColor: '#2196F3',
  },
  markerOrigin: {
    backgroundColor: colors.primary,
  },
  markerDestination: {
    backgroundColor: '#4CAF50',
  },
  markerLabel: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default TaskLocationMap;
