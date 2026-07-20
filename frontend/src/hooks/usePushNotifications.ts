import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { navigationRef } from '../navigation/navigationRef';
import { registerPushToken } from '../services/notificationService';

/** Set once a push token is successfully registered this session, so AuthContext.logout can unregister it. */
export let lastKnownPushToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Maps a notification's `type` (and optional `relatedEntityId`) to the in-app screen it should
 * open. Used both for tap-to-navigate on an OS push notification and for tapping a row in the
 * in-app notification list, so the two stay in sync.
 */
export function navigateForNotificationType(type: string, relatedEntityId: string | null): void {
  if (!navigationRef.isReady()) return;
  // The route name is only known at runtime (parsed off a notification payload), so it can't be
  // narrowed to one of the navigator's literal route names — that's exactly what this cast is for.
  const navigate = navigationRef.navigate as unknown as (name: string, params?: object) => void;

  if (type.startsWith('BID_') || type.startsWith('TASK_')) {
    navigate('TaskDetails', { taskId: relatedEntityId });
  } else if (type.startsWith('RENTAL_')) {
    navigate('ListingDetails', { listingId: relatedEntityId });
  } else if (type === 'NEW_MESSAGE') {
    navigate('ChatDetail', { conversationId: relatedEntityId });
  } else if (type.startsWith('WALLET_')) {
    navigate('Wallet');
  }
}

/**
 * Requests notification permission, registers the device's Expo push token with the backend, and
 * wires tap-to-navigate for notification responses. Only does any of this while `enabled` is true
 * (i.e. the user is authenticated) — call unconditionally from the root and pass `isAuthenticated`,
 * since hooks can't be called conditionally.
 */
export function usePushNotifications(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      // getExpoPushTokenAsync() doesn't work on simulators/emulators anyway.
      if (!Device.isDevice) return;

      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted') return;

      try {
        // Requires `extra.eas.projectId` in app.json (set via `eas init`), which this repo does
        // not have configured yet. Without it, this throws — that's expected, so we swallow it
        // and leave the rest of the app (permission prompt, in-app list) working normally.
        const token = await Notifications.getExpoPushTokenAsync();
        if (cancelled) return;
        lastKnownPushToken = token.data;
        await registerPushToken(token.data);
      } catch (error) {
        console.warn('Failed to obtain/register Expo push token', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const type = typeof data.type === 'string' ? data.type : null;
      const relatedEntityId = typeof data.relatedEntityId === 'string' ? data.relatedEntityId : null;
      if (!type) return;
      navigateForNotificationType(type, relatedEntityId);
    });

    return () => {
      subscription.remove();
    };
  }, [enabled]);
}
