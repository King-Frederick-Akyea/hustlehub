// src/screens/main/TasksScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { TASK_CATEGORIES } from '../../constants';
import { getOpenTasks, TaskItem } from '../../services/taskService';
import { categoryMeta, distanceKm, formatDistance, formatRelativeTime, resolveAvatarUrl } from '../../utils/taskDisplay';
import { useUserLocation } from '../../hooks/useUserLocation';
import { Loading } from '../../components/Shared';
import Avatar from '../../components/Avatar';

const filters = [{ id: 'all', label: 'All' }, ...TASK_CATEGORIES];

const TasksScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { location } = useUserLocation();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await getOpenTasks());
    } catch (error) {
      console.warn('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const tasksWithDistance = useMemo(() => {
    return tasks.map((task) => {
      const distance =
        location && task.locationLat != null && task.locationLng != null
          ? distanceKm(location.latitude, location.longitude, task.locationLat, task.locationLng)
          : null;
      return { task, distance };
    });
  }, [tasks, location]);

  const filteredTasks = tasksWithDistance
    .filter(({ task }) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeFilter === 'all') return matchesSearch;
      return matchesSearch && task.category === activeFilter;
    })
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });

  const renderItem = ({ item }: { item: { task: TaskItem; distance: number | null } }) => {
    const { task, distance } = item;
    const meta = categoryMeta(task.category);
    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: `${meta.color}15` }]}>
            <Ionicons name={meta.icon as any} size={12} color={meta.color} />
            <Text style={[styles.categoryText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <View style={styles.budgetChip}>
            <Text style={styles.budgetChipText}>GH₵ {task.budget}</Text>
          </View>
        </View>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.locationText}>{task.location}</Text>
          {distance != null && (
            <>
              <View style={styles.dot} />
              <Text style={styles.distanceText}>{formatDistance(distance)} away</Text>
            </>
          )}
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.posterInfo}>
            <Avatar source={resolveAvatarUrl(task.poster.avatarUrl)} name={task.poster.fullName} size="sm" />
            <View style={{ marginLeft: spacing.sm }}>
              <Text style={styles.posterName}>{task.poster.fullName}</Text>
              <Text style={styles.timeText}>{task.bidCount} bids</Text>
            </View>
          </View>
          <Text style={styles.timeText}>{formatRelativeTime(task.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterPill, activeFilter === filter.id && styles.filterPillActive]}
              onPress={() => setActiveFilter(filter.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterText, activeFilter === filter.id && styles.filterTextActive]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} found
          {location ? ' · sorted by distance' : ''}
        </Text>
      </View>

      {/* Tasks List */}
      {loading ? (
        <Loading text="Loading tasks..." />
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderItem}
          keyExtractor={(item) => item.task.id}
          contentContainerStyle={[styles.tasksList, { paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyStateText}>No tasks match your search</Text>
            </View>
          }
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  tasksList: {
    paddingHorizontal: spacing.lg,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  budgetChip: {
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  budgetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  taskTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
    marginHorizontal: spacing.sm,
  },
  distanceText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  posterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posterName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

export default TasksScreen;
