// src/screens/main/MyTasksScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useRole } from '../../context/RoleContext';
import { getMyTasks, TaskItem } from '../../services/taskService';
import { taskDetailRoute } from '../../utils/taskDisplay';
import { Loading } from '../../components/Shared';

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: colors.primary },
  bidding: { label: 'Open', color: colors.primary },
  assigned: { label: 'Active', color: colors.primary },
  in_progress: { label: 'Active', color: colors.primary },
  completed: { label: 'Done', color: colors.success },
  cancelled: { label: 'Cancelled', color: colors.error },
  disputed: { label: 'Disputed', color: colors.error },
};

const MyTasksScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentRole } = useRole();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isPoster = currentRole === 'poster';

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyTasks(isPoster ? 'posted' : 'assigned');
      setTasks(result);
    } catch (error) {
      console.warn('Failed to load my tasks', error);
    } finally {
      setLoading(false);
    }
  }, [isPoster]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'active') {
      return task.status !== 'completed' && task.status !== 'cancelled';
    }
    return task.status === 'completed' || task.status === 'cancelled';
  });

  const renderTask = ({ item }: { item: TaskItem }) => {
    const display = STATUS_DISPLAY[item.status] ?? { label: item.status, color: colors.textSecondary };
    return (
      <TouchableOpacity
        style={styles.taskItem}
        onPress={() => navigation.navigate(taskDetailRoute(item.status), { taskId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.taskIcon}>
          <Ionicons
            name={item.status === 'completed' ? 'checkmark-circle' : 'time-outline'}
            size={22}
            color={display.color}
          />
        </View>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskMeta}>{item.location} · GH₵ {item.finalPrice ?? item.budget}</Text>
        </View>
        <View style={styles.rightColumn}>
          <View style={[styles.statusBadge, { backgroundColor: `${display.color}15` }]}>
            <Text style={[styles.statusText, { color: display.color }]}>{display.label}</Text>
          </View>
          {isPoster && item.status === 'open' && item.bidCount > 0 && (
            <View style={styles.offersBadge}>
              <Ionicons name="pricetag" size={11} color="#FFFFFF" />
              <Text style={styles.offersBadgeText}>
                {item.bidCount} offer{item.bidCount === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSubtitle}>
          {isPoster ? 'Tasks you posted' : 'Tasks you accepted'}
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loading text="Loading tasks..." />
      ) : filteredTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkbox-outline" size={50} color={colors.textTertiary} />
          <Text style={styles.emptyStateTitle}>No {activeTab} tasks</Text>
          <Text style={styles.emptyStateSubtext}>
            {activeTab === 'active'
              ? isPoster
                ? "You haven't posted any active tasks."
                : "You haven't accepted any active tasks."
              : isPoster
              ? "You haven't completed any posted tasks."
              : "You haven't completed any accepted tasks."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: typography.fontSize.sm, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskIcon: { marginRight: spacing.md },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: typography.fontSize.base, fontWeight: '600', color: colors.textPrimary },
  taskMeta: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  offersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  offersBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.md },
  emptyStateSubtext: { fontSize: typography.fontSize.base, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

export default MyTasksScreen;
