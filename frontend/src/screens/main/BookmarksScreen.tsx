// src/screens/main/BookmarksScreen.tsx
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
import { getBookmarkedTasks, TaskItem } from '../../services/taskService';
import { categoryMeta, formatRelativeTime, resolveAvatarUrl, taskDetailRoute } from '../../utils/taskDisplay';
import { Loading } from '../../components/Shared';
import Avatar from '../../components/Avatar';

const BookmarksScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBookmarkedTasks();
      setTasks(result);
    } catch (error) {
      console.warn('Failed to load bookmarked tasks', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [loadBookmarks])
  );

  const renderTask = ({ item }: { item: TaskItem }) => {
    const meta = categoryMeta(item.category);
    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => navigation.navigate(taskDetailRoute(item.status), { taskId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.taskCardTop}>
          <View style={[styles.categoryChip, { backgroundColor: `${meta.color}15` }]}>
            <Ionicons name={meta.icon as any} size={14} color={meta.color} />
            <Text style={[styles.categoryText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Ionicons name="bookmark" size={18} color={colors.primary} />
        </View>

        <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.taskCardBottom}>
          <View style={styles.posterRow}>
            <Avatar source={resolveAvatarUrl(item.poster.avatarUrl)} name={item.poster.fullName} size="xs" />
            <View style={styles.posterInfo}>
              <Text style={styles.posterName}>{item.poster.fullName}</Text>
              <Text style={styles.posterTime}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.budgetBlock}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={styles.budgetValue}>GH₵ {item.budget}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Tasks</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <Loading text="Loading saved tasks..." />
      ) : tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={50} color={colors.textTertiary} />
          <Text style={styles.emptyStateTitle}>No saved tasks yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Tasks you bookmark will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 100 },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  taskTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, lineHeight: 22 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationText: { fontSize: typography.fontSize.sm, color: colors.textPrimary, marginLeft: 4, fontWeight: '500' },
  cardDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md, opacity: 0.5 },
  taskCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  posterRow: { flexDirection: 'row', alignItems: 'center' },
  posterInfo: { marginLeft: spacing.sm },
  posterName: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  posterTime: { fontSize: typography.fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  budgetBlock: { alignItems: 'flex-end' },
  budgetLabel: { fontSize: typography.fontSize.xs, color: colors.textTertiary, marginBottom: 2 },
  budgetValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.md },
  emptyStateSubtext: { fontSize: typography.fontSize.base, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

export default BookmarksScreen;
