export type LatLng = { latitude: number; longitude: number };

export interface EdgePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Imperative handle shared by the native (react-native-maps) and web (static fallback) implementations. */
export interface TaskLocationMapHandle {
  animateToRegion: (region: LatLng & { latitudeDelta: number; longitudeDelta: number }, durationMs?: number) => void;
  fitToCoordinates: (coordinates: LatLng[], edgePadding: EdgePadding) => void;
}

export interface TaskLocationMapProps {
  origin: LatLng;
  destination: LatLng;
  userLocation: LatLng | null;
  routeCoordinates: LatLng[];
  isDelivery: boolean;
}
