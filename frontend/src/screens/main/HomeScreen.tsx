// src/screens/main/HomeScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useRole } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import { getMyTasks, getOpenTasks, TaskItem } from '../../services/taskService';
import { categoryMeta, distanceKm, formatDistance, formatRelativeTime, resolveAvatarUrl, taskDetailRoute } from '../../utils/taskDisplay';
import { useUserLocation } from '../../hooks/useUserLocation';
import { Loading } from '../../components/Shared';
import Avatar from '../../components/Avatar';

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentRole } = useRole();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { location } = useUserLocation();

  const isPoster = currentRole === 'poster';

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = isPoster ? await getMyTasks('posted') : await getOpenTasks();
      setTasks(result);
    } catch (error) {
      console.warn('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  }, [isPoster]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const filteredTasks = tasks
    .filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryMeta(task.category).label.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (isPoster || !location) return 0;
      const da = a.locationLat != null && a.locationLng != null ? distanceKm(location.latitude, location.longitude, a.locationLat, a.locationLng) : Infinity;
      const db = b.locationLat != null && b.locationLng != null ? distanceKm(location.latitude, location.longitude, b.locationLat, b.locationLng) : Infinity;
      return da - db;
    });

  const TaskCardItem = ({ task }: { task: TaskItem }) => {
    const meta = categoryMeta(task.category);
    const distance = !isPoster && location && task.locationLat != null && task.locationLng != null
      ? distanceKm(location.latitude, location.longitude, task.locationLat, task.locationLng)
      : null;
    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => navigation.navigate(taskDetailRoute(task.status), { taskId: task.id })}
        activeOpacity={0.7}
      >
        <View style={styles.taskCardTop}>
          <View style={[styles.categoryChip, { backgroundColor: `${meta.color}15` }]}>
            <Ionicons name={meta.icon as any} size={14} color={meta.color} />
            <Text style={[styles.categoryText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {task.isUrgent && (
            <View style={styles.urgentChip}>
              <Ionicons name="flash" size={12} color="#FF6B6B" />
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          )}
        </View>

        <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.locationText}>{task.location}</Text>
          {distance != null && (
            <Text style={styles.distanceText}> · {formatDistance(distance)} away</Text>
          )}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.taskCardBottom}>
          <View style={styles.posterRow}>
            <Avatar source={resolveAvatarUrl(task.poster.avatarUrl)} name={task.poster.fullName} size="xs" />
            <View style={styles.posterInfo}>
              <Text style={styles.posterName}>{isPoster ? 'You' : task.poster.fullName}</Text>
              <View style={styles.posterMeta}>
                <Ionicons name="hand-left-outline" size={12} color={colors.textTertiary} />
                <Text style={styles.posterTime}> {task.bidCount} bids · {formatRelativeTime(task.createdAt)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.budgetBlock}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={styles.budgetValue}>GH₵ {task.budget}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar source={resolveAvatarUrl(user?.avatarUrl)} name={user?.fullName} size="md" />
          <View style={{ marginLeft: spacing.sm }}>
            <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] ?? 'there'}</Text>
            <Text style={styles.subGreeting}>
              {isPoster ? 'Your posted tasks' : 'Find tasks nearby'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isPoster ? 'Search your tasks...' : 'Search tasks, services...'}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionPill}
            onPress={() => navigation.navigate('Rentals')}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
            <Text style={styles.quickActionText}>Rentals & Barter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionPill}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.7}
          >
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            <Text style={styles.quickActionText}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isPoster ? 'Your Posted Tasks' : 'Tasks Near You'}
            </Text>
            {!isPoster && (
              <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <Loading text="Loading tasks..." />
          ) : filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No tasks match your search' : isPoster ? "You haven't posted any tasks yet" : 'No open tasks right now'}
              </Text>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <TaskCardItem key={task.id} task={task} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  subGreeting: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 1 },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surfaceSecondary,
  },
  scrollContent: { paddingTop: spacing.sm },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: typography.fontSize.base, color: colors.textPrimary, paddingVertical: 0 },
  clearButton: { padding: 4 },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  quickActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  quickActionText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.primary },
  section: { paddingHorizontal: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  seeAll: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: '600' },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  taskCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  categoryText: { fontSize: 12, fontWeight: '600' },
  urgentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  urgentText: { fontSize: 12, fontWeight: '600', color: '#FF6B6B' },
  taskTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, lineHeight: 22 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationText: { fontSize: typography.fontSize.sm, color: colors.textPrimary, marginLeft: 4, fontWeight: '500' },
  distanceText: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: '500' },
  cardDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md, opacity: 0.5 },
  taskCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  posterRow: { flexDirection: 'row', alignItems: 'center' },
  posterInfo: { marginLeft: spacing.sm },
  posterName: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  posterMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  posterTime: { fontSize: typography.fontSize.xs, color: colors.textTertiary },
  budgetBlock: { alignItems: 'flex-end' },
  budgetLabel: { fontSize: typography.fontSize.xs, color: colors.textTertiary, marginBottom: 2 },
  budgetValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: typography.fontSize.base, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
});

export default HomeScreen;
