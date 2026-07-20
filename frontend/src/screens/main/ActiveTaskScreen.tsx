// src/screens/main/ActiveTaskScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { categoryMeta, formatRelativeTime, resolveAvatarUrl } from '../../utils/taskDisplay';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../api/errors';
import {
  getTask,
  completeTask,
  startConversationWith,
  getTaskStatusUpdates,
  postTaskStatusUpdate,
  TaskItem,
  TaskStatusUpdateItem,
} from '../../services/taskService';
import { Loading } from '../../components/Shared';
import Avatar from '../../components/Avatar';
import type { ScreenProps } from '../../navigation/types';

const QUICK_REPLIES = ['On my way', 'Started', 'Picked up', 'Almost done'];

const STATUS_META: Record<string, { label: string; color: string }> = {
  in_progress: { label: 'In Progress', color: colors.primary },
  completed: { label: 'Completed', color: colors.success },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ActiveTaskScreen = ({ navigation, route }: ScreenProps<'ActiveTask'>) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const taskId: string | undefined = route.params?.taskId;

  const [task, setTask] = useState<TaskItem | null>(null);
  const [updates, setUpdates] = useState<TaskStatusUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [completing, setCompleting] = useState(false);
  const [posting, setPosting] = useState(false);
  const [composerText, setComposerText] = useState('');

  const loadAll = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setLoadError('');
    try {
      const [fetchedTask, fetchedUpdates] = await Promise.all([
        getTask(taskId),
        getTaskStatusUpdates(taskId),
      ]);
      setTask(fetchedTask);
      setUpdates(fetchedUpdates);
    } catch (error) {
      setLoadError(parseApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const isPoster = !!(task && user && task.poster.id === user.id);
  const otherParty = task ? (isPoster ? task.assignedTasker : task.poster) : null;
  const isAssignedTasker = !!(task && user && task.assignedTasker?.id === user.id);
  const meta = task ? categoryMeta(task.category) : null;
  const statusMeta = task ? STATUS_META[task.status] : undefined;

  const canManage = task ? task.status === 'in_progress' : false;
  const showComposer = canManage && isAssignedTasker;
  const showCompleteButton = canManage && (isPoster || isAssignedTasker);

  const handleMessage = async () => {
    if (!task || !otherParty) return;
    setActionError('');
    try {
      const conversation = await startConversationWith(otherParty.id, task.id);
      navigation.navigate('ChatDetail', { conversationId: conversation.id });
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  };

  const handleComplete = async () => {
    if (!task || completing) return;
    setActionError('');
    setCompleting(true);
    try {
      const updated = await completeTask(task.id);
      setTask(updated);
    } catch (error) {
      setActionError(parseApiError(error).message);
    } finally {
      setCompleting(false);
    }
  };

  const handleSendUpdate = async () => {
    const note = composerText.trim();
    if (!task || !note || posting) return;
    setActionError('');
    setPosting(true);
    try {
      const created = await postTaskStatusUpdate(task.id, note);
      setUpdates((prev) => [...prev, created]);
      setComposerText('');
    } catch (error) {
      setActionError(parseApiError(error).message);
    } finally {
      setPosting(false);
    }
  };

  if (loading && !task) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Loading text="Loading active task..." />
      </View>
    );
  }

  if (!task || task.status === 'open') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }]}>
        <Ionicons name="hourglass-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.fallbackText}>
          {loadError || 'This task is not active yet.'}
        </Text>
        <TouchableOpacity style={styles.fallbackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.fallbackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priceValue = task.finalPrice ?? task.budget;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Task</Text>
        {statusMeta ? (
          <View style={[styles.statusPill, { backgroundColor: `${statusMeta.color}15` }]}>
            <Text style={[styles.statusPillText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            {meta && (
              <View style={[styles.categoryBadge, { backgroundColor: `${meta.color}15` }]}>
                <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                <Text style={[styles.categoryText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="cash" size={16} color="#4CAF50" />
            </View>
            <Text style={styles.summaryLabel}>Price</Text>
            <Text style={styles.summaryValue}>GH₵ {priceValue}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="location" size={16} color="#2196F3" />
            </View>
            <Text style={styles.summaryLabel}>Location</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>{task.location}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="calendar" size={16} color="#FF9800" />
            </View>
            <Text style={styles.summaryLabel}>{task.status === 'completed' ? 'Completed' : 'Deadline'}</Text>
            <Text style={styles.summaryValue}>
              {task.status === 'completed' && task.completedAt
                ? formatDateTime(task.completedAt)
                : formatDateTime(task.deadline)}
            </Text>
          </View>
        </View>

        {/* Other party card */}
        {otherParty && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isPoster ? 'Assigned Tasker' : 'Posted By'}</Text>
            <View style={styles.otherPartyRow}>
              <Avatar source={resolveAvatarUrl(otherParty.avatarUrl)} name={otherParty.fullName} size="md" />
              <View style={styles.otherPartyInfo}>
                <View style={styles.otherPartyNameRow}>
                  <Text style={styles.otherPartyName}>{otherParty.fullName}</Text>
                  {otherParty.verified && (
                    <Ionicons name="checkmark-circle" size={15} color={colors.verified} style={{ marginLeft: 4 }} />
                  )}
                </View>
                <Text style={styles.otherPartyRole}>{isPoster ? 'Tasker' : 'Poster'}</Text>
              </View>
              <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Progress Log</Text>
          {updates.length === 0 ? (
            <View style={styles.emptyTimeline}>
              <Ionicons name="time-outline" size={36} color={colors.textTertiary} />
              <Text style={styles.emptyTimelineText}>No updates yet</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {updates.map((update, index) => {
                const isLast = index === updates.length - 1;
                const isMe = !!user && update.author.id === user.id;
                return (
                  <View key={update.id} style={styles.timelineRow}>
                    <View style={styles.timelineMarkerColumn}>
                      <View style={styles.timelineDot} />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={[styles.timelineContent, isLast && { paddingBottom: 0 }]}>
                      <View style={styles.timelineHeaderRow}>
                        <Text style={styles.timelineAuthor}>{isMe ? 'You' : update.author.fullName}</Text>
                        <Text style={styles.timelineTime}>{formatRelativeTime(update.createdAt)}</Text>
                      </View>
                      <Text style={styles.timelineNote}>{update.note}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

        {task.status === 'completed' && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.completedBannerText}>Task Completed</Text>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {(showComposer || showCompleteButton) && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
            {showComposer && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickChipsRow}
                >
                  {QUICK_REPLIES.map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={styles.quickReplyChip}
                      onPress={() => setComposerText(preset)}
                    >
                      <Text style={styles.quickReplyChipText}>{preset}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.composerRow}>
                  <TextInput
                    style={styles.composerInput}
                    placeholder="Post a status update..."
                    placeholderTextColor={colors.placeholder}
                    value={composerText}
                    onChangeText={setComposerText}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, (!composerText.trim() || posting) && styles.sendButtonDisabled]}
                    onPress={handleSendUpdate}
                    disabled={!composerText.trim() || posting}
                  >
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </>
            )}
            {showCompleteButton && (
              <TouchableOpacity
                style={[styles.completeButton, completing && styles.completeButtonDisabled]}
                onPress={handleComplete}
                disabled={completing}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>
                  {completing ? 'Marking Complete...' : 'Mark Task Complete'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fallbackText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  fallbackButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
  },
  fallbackButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: 25,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    flex: 1,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  otherPartyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherPartyInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  otherPartyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherPartyName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  otherPartyRole: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTimeline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  emptyTimelineText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  timeline: {
    marginTop: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineMarkerColumn: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingBottom: spacing.md,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineAuthor: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timelineTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  timelineNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
  },
  completedBannerText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.success,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickChipsRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  quickReplyChip: {
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  quickReplyChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 14,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ActiveTaskScreen;
