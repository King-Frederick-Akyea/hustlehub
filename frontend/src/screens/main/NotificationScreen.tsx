// src/screens/main/NotificationsScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { EmptyState } from '../../components/Shared';
import { formatRelativeTime } from '../../utils/taskDisplay';
import { parseApiError } from '../../api/errors';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  AppNotification,
  NotificationType,
} from '../../services/notificationService';
import { navigateForNotificationType } from '../../hooks/usePushNotifications';

const ICONS: Record<NotificationType, React.ComponentProps<typeof Ionicons>['name']> = {
  BID_RECEIVED: 'briefcase-outline',
  BID_ACCEPTED: 'briefcase-outline',
  BID_REJECTED: 'briefcase-outline',
  BID_WITHDRAWN: 'briefcase-outline',
  TASK_ACCEPTED: 'briefcase-outline',
  TASK_COMPLETED: 'checkmark-circle-outline',
  TASK_PAYMENT_RECEIVED: 'cash-outline',
  RENTAL_OFFER_RECEIVED: 'home-outline',
  RENTAL_OFFER_ACCEPTED: 'home-outline',
  RENTAL_OFFER_REJECTED: 'home-outline',
  RENTAL_OFFER_WITHDRAWN: 'home-outline',
  RENTAL_PAYMENT_RECEIVED: 'cash-outline',
  NEW_MESSAGE: 'chatbubble-outline',
  WALLET_DEPOSIT: 'wallet-outline',
  WALLET_WITHDRAWAL: 'wallet-outline',
  WALLET_WITHDRAWAL_FAILED: 'wallet-outline',
};

const getIcon = (type: NotificationType): React.ComponentProps<typeof Ionicons>['name'] => {
  return ICONS[type] ?? 'notifications-outline';
};

const NotificationScreen = () => {
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadNotifications = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    setLoadError('');
    try {
      const result = await getNotifications();
      setNotifications(result);
    } catch (error) {
      setLoadError(parseApiError(error).message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications(true);
    }, [loadNotifications])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications(false);
    setRefreshing(false);
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllAsRead();
    } catch (error) {
      // Best-effort optimistic update — a subsequent refresh will reconcile with the server.
    }
  }, []);

  const handlePressNotification = useCallback(async (item: AppNotification) => {
    if (!item.read) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      try {
        await markAsRead(item.id);
      } catch (error) {
        // Best-effort optimistic update — a subsequent refresh will reconcile with the server.
      }
    }
    navigateForNotificationType(item.type, item.relatedEntityId);
  }, []);

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handlePressNotification(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={getIcon(item.type)} size={22} color={colors.primary} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead} disabled={!hasUnread}>
          <Text style={[styles.markAll, !hasUnread && styles.markAllDisabled]}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      {loadError ? <Text style={styles.loadErrorText}>{loadError}</Text> : null}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="notifications-outline"
              title="No notifications yet"
              description="Updates about your tasks, rentals, messages, and wallet will show up here."
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  markAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  markAllDisabled: {
    color: colors.textTertiary,
  },
  loadErrorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unreadItem: {
    backgroundColor: colors.primary + '05',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
});

export default NotificationScreen;
