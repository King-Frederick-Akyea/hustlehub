import { apiClient } from '../api/client';

export interface ChatUserSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  verified: boolean;
}

export interface Conversation {
  id: string;
  otherUser: ChatUserSummary;
  relatedTaskId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string | null;
  /** Relative path (e.g. "/api/conversations/{id}/messages/{messageId}/image") — private, requires the Authorization header (see ChatDetailScreen). */
  imageUrl: string | null;
  createdAt: string;
  isMine: boolean;
  read: boolean;
}

export async function startConversationWith(userId: string, taskId?: string): Promise<Conversation> {
  const res = await apiClient.post<Conversation>(
    `/api/conversations/with/${userId}`,
    taskId ? { taskId } : {}
  );
  return res.data;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await apiClient.get<Conversation[]>('/api/conversations');
  return res.data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await apiClient.get<Conversation>(`/api/conversations/${id}`);
  return res.data;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await apiClient.get<ChatMessage[]>(`/api/conversations/${conversationId}/messages`);
  return res.data;
}

export async function sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
  const res = await apiClient.post<ChatMessage>(`/api/conversations/${conversationId}/messages`, { text });
  return res.data;
}

export async function sendImageMessage(conversationId: string, uri: string, caption?: string): Promise<ChatMessage> {
  const formData = new FormData();
  if (caption && caption.trim()) {
    formData.append('text', caption.trim());
  }
  // React Native's FormData accepts this shape for file uploads; axios/RN handle the multipart boundary.
  formData.append('file', {
    uri,
    name: 'chat-photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await apiClient.post<ChatMessage>(`/api/conversations/${conversationId}/messages/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function markAsRead(conversationId: string): Promise<void> {
  await apiClient.post(`/api/conversations/${conversationId}/read`);
}
