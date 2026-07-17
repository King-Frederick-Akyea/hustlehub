import { apiClient } from '../api/client';

export type TaskCategoryId =
  | 'grocery'
  | 'laundry'
  | 'documents'
  | 'queue'
  | 'delivery'
  | 'tutoring'
  | 'cleaning'
  | 'tech'
  | 'moving'
  | 'other';

export type TaskStatus = 'open' | 'bidding' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface UserSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  verified: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: TaskCategoryId;
  budget: number;
  location: string;
  locationLat: number | null;
  locationLng: number | null;
  isDelivery: boolean;
  pickupLocation: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLocation: string | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  deadline: string;
  isUrgent: boolean;
  status: TaskStatus;
  poster: UserSummary;
  assignedTasker: UserSummary | null;
  finalPrice: number | null;
  bidCount: number;
  myBidStatus: BidStatus | null;
  createdAt: string;
  completedAt: string | null;
}

export interface BidItem {
  id: string;
  taskId: string;
  tasker: UserSummary;
  amount: number;
  message: string | null;
  deliveryTime: string | null;
  status: BidStatus;
  createdAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  category: TaskCategoryId;
  budget: number;
  location: string;
  locationLat?: number | null;
  locationLng?: number | null;
  isDelivery: boolean;
  pickupLocation?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLocation?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  deadline: string;
  isUrgent: boolean;
}

export interface PlaceBidPayload {
  amount: number;
  message?: string;
  deliveryTime?: string;
}

export async function createTask(payload: CreateTaskPayload): Promise<TaskItem> {
  const res = await apiClient.post<TaskItem>('/api/tasks', payload);
  return res.data;
}

export async function getOpenTasks(params?: { category?: string; search?: string }): Promise<TaskItem[]> {
  const res = await apiClient.get<TaskItem[]>('/api/tasks', { params });
  return res.data;
}

export async function getMyTasks(role: 'posted' | 'assigned'): Promise<TaskItem[]> {
  const res = await apiClient.get<TaskItem[]>('/api/tasks/mine', { params: { role } });
  return res.data;
}

export async function getTask(id: string): Promise<TaskItem> {
  const res = await apiClient.get<TaskItem>(`/api/tasks/${id}`);
  return res.data;
}

export async function acceptTask(id: string): Promise<TaskItem> {
  const res = await apiClient.post<TaskItem>(`/api/tasks/${id}/accept`);
  return res.data;
}

export async function cancelTask(id: string): Promise<TaskItem> {
  const res = await apiClient.post<TaskItem>(`/api/tasks/${id}/cancel`);
  return res.data;
}

export async function completeTask(id: string): Promise<TaskItem> {
  const res = await apiClient.post<TaskItem>(`/api/tasks/${id}/complete`);
  return res.data;
}

export async function placeBid(taskId: string, payload: PlaceBidPayload): Promise<BidItem> {
  const res = await apiClient.post<BidItem>(`/api/tasks/${taskId}/bids`, payload);
  return res.data;
}

export async function getBidsForTask(taskId: string): Promise<BidItem[]> {
  const res = await apiClient.get<BidItem[]>(`/api/tasks/${taskId}/bids`);
  return res.data;
}

export async function acceptBid(bidId: string): Promise<TaskItem> {
  const res = await apiClient.post<TaskItem>(`/api/bids/${bidId}/accept`);
  return res.data;
}

export async function withdrawBid(bidId: string): Promise<BidItem> {
  const res = await apiClient.post<BidItem>(`/api/bids/${bidId}/withdraw`);
  return res.data;
}

export interface ConversationSummary {
  id: string;
  otherUser: UserSummary;
  relatedTaskId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export async function startConversationWith(userId: string, taskId?: string): Promise<ConversationSummary> {
  const res = await apiClient.post<ConversationSummary>(`/api/conversations/with/${userId}`, taskId ? { taskId } : {});
  return res.data;
}

export async function bookmarkTask(taskId: string): Promise<void> {
  await apiClient.post(`/api/tasks/${taskId}/bookmark`);
}

export async function unbookmarkTask(taskId: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${taskId}/bookmark`);
}

export async function getBookmarkStatus(taskId: string): Promise<boolean> {
  const res = await apiClient.get<{ bookmarked: boolean }>(`/api/tasks/${taskId}/bookmark`);
  return res.data.bookmarked;
}

export async function getBookmarkedTasks(): Promise<TaskItem[]> {
  const res = await apiClient.get<TaskItem[]>('/api/tasks/bookmarks');
  return res.data;
}

export interface TaskStatusUpdateItem {
  id: string;
  note: string;
  author: UserSummary;
  createdAt: string;
}

export async function getTaskStatusUpdates(taskId: string): Promise<TaskStatusUpdateItem[]> {
  const res = await apiClient.get<TaskStatusUpdateItem[]>(`/api/tasks/${taskId}/status-updates`);
  return res.data;
}

export async function postTaskStatusUpdate(taskId: string, note: string): Promise<TaskStatusUpdateItem> {
  const res = await apiClient.post<TaskStatusUpdateItem>(`/api/tasks/${taskId}/status-updates`, { note });
  return res.data;
}
