import { apiClient } from '../api/client';

export type NotificationType =
  | 'BID_RECEIVED' | 'BID_ACCEPTED' | 'BID_REJECTED' | 'BID_WITHDRAWN'
  | 'TASK_ACCEPTED' | 'TASK_COMPLETED' | 'TASK_PAYMENT_RECEIVED'
  | 'RENTAL_OFFER_RECEIVED' | 'RENTAL_OFFER_ACCEPTED' | 'RENTAL_OFFER_REJECTED' | 'RENTAL_OFFER_WITHDRAWN' | 'RENTAL_PAYMENT_RECEIVED'
  | 'NEW_MESSAGE'
  | 'WALLET_DEPOSIT' | 'WALLET_WITHDRAWAL' | 'WALLET_WITHDRAWAL_FAILED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  relatedEntityId: string | null;
  createdAt: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await apiClient.get<AppNotification[]>('/api/notifications');
  return res.data;
}

export async function markAsRead(id: string): Promise<AppNotification> {
  const res = await apiClient.patch<AppNotification>(`/api/notifications/${id}/read`);
  return res.data;
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.post('/api/notifications/read-all');
}

export async function registerPushToken(expoPushToken: string): Promise<void> {
  await apiClient.post('/api/notifications/tokens', { expoPushToken });
}

export async function unregisterPushToken(expoPushToken: string): Promise<void> {
  await apiClient.delete('/api/notifications/tokens', { data: { expoPushToken } });
}
