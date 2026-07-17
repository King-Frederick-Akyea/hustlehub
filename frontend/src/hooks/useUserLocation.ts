import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Requests foreground location permission once and returns the device's current coordinates, if granted. */
export function useUserLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelled) setPermissionDenied(true);
        return;
      }
      try {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!cancelled) {
          setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        }
      } catch (error) {
        console.warn('Failed to get current location', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { location, permissionDenied };
}
