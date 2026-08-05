import { apiClient } from '../api/client';

export type UserRole = 'poster' | 'tasker' | 'both';

export type VerificationStatus =
  | 'pending'
  | 'email_verified'
  | 'id_submitted'
  | 'id_verified'
  | 'face_verified'
  | 'fully_verified'
  | 'rejected';

export type AccountStatus = 'active' | 'suspended';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  emailVerified: boolean;
  bio?: string | null;
  avatarUrl?: string | null;
  completedTasksCount: number;
  totalEarnings: number;
  averageRating: number;
  reviewCount: number;
  adminVerified: boolean;
  accountStatus: AccountStatus;
  suspensionReason?: string | null;
  phoneNumber?: string | null;
  availability?: string | null;
  specializations: string[];
  createdAt: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const res = await apiClient.post<AuthResult>('/api/auth/register', payload);
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await apiClient.post<AuthResult>('/api/auth/login', { email, password });
  return res.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/api/auth/logout', { refreshToken });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await apiClient.get<AuthUser>('/api/users/me');
  return res.data;
}

/** Another user's profile — no email/phone/earnings, see identity-service's PublicProfileResponse. */
export interface PublicProfile {
  id: string;
  fullName: string;
  role: UserRole;
  bio: string | null;
  avatarUrl: string | null;
  adminVerified: boolean;
  completedTasksCount: number;
  averageRating: number;
  reviewCount: number;
  availability: string | null;
  specializations: string[];
  memberSince: string;
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile> {
  const res = await apiClient.get<PublicProfile>(`/api/users/${userId}`);
  return res.data;
}

export async function verifyEmail(code: string): Promise<AuthUser> {
  const res = await apiClient.post<{ user: AuthUser }>('/api/verification/email/verify', { code });
  return res.data.user;
}

export interface ResendVerificationResult {
  message: string;
  devVerificationCode?: string;
}

export async function resendVerification(): Promise<ResendVerificationResult> {
  const res = await apiClient.post<ResendVerificationResult>('/api/verification/email/resend');
  return res.data;
}

async function uploadImage(endpoint: string, uri: string, filename: string): Promise<AuthUser> {
  const formData = new FormData();
  // React Native's FormData accepts this shape for file uploads; axios/RN handle the multipart boundary.
  formData.append('file', {
    uri,
    name: filename,
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await apiClient.post<{ user: AuthUser }>(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.user;
}

export async function uploadStudentId(uri: string): Promise<AuthUser> {
  return uploadImage('/api/verification/student-id', uri, 'student-id.jpg');
}

export async function uploadFacePhoto(uri: string): Promise<AuthUser> {
  return uploadImage('/api/verification/face-photo', uri, 'face-photo.jpg');
}

export async function updateProfile(data: {
  fullName?: string;
  bio?: string;
  phoneNumber?: string;
  availability?: string;
  specializations?: string[];
}): Promise<AuthUser> {
  const res = await apiClient.patch<AuthUser>('/api/users/me', data);
  return res.data;
}

export async function uploadAvatar(uri: string): Promise<AuthUser> {
  const formData = new FormData();
  // React Native's FormData accepts this shape for file uploads; axios/RN handle the multipart boundary.
  formData.append('file', {
    uri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  // Unlike the verification endpoints, /api/users/me/avatar returns the UserResponse directly
  // (not wrapped in { user: ... }), so this doesn't reuse the shared uploadImage() helper.
  const res = await apiClient.post<AuthUser>('/api/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export interface ForgotPasswordResult {
  message: string;
  devResetToken?: string;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  const res = await apiClient.post<ForgotPasswordResult>('/api/auth/forgot-password', { email });
  return res.data;
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>('/api/auth/reset-password', { token, newPassword });
  return res.data;
}
