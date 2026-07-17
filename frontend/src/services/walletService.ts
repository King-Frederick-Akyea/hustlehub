import { apiClient } from '../api/client';

export type WalletTransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TASK_PAYMENT' | 'RENTAL_PAYMENT';
export type WalletTransactionDirection = 'CREDIT' | 'DEBIT';
export type WalletTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type MobileMoneyProvider = 'MTN' | 'VODAFONE' | 'AIRTELTIGO';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  amount: number;
  status: WalletTransactionStatus;
  description: string | null;
  relatedUserId: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface WalletBalance {
  available: number;
  pending: number;
  held: number;
}

export interface InitializeTopupResponse {
  authorizationUrl: string;
  reference: string;
}

export interface WithdrawPayload {
  amount: number;
  mobileMoneyNumber: string;
  provider: MobileMoneyProvider;
}

export async function getBalance(): Promise<WalletBalance> {
  const res = await apiClient.get<WalletBalance>('/api/payments/balance');
  return res.data;
}

export async function getTransactions(): Promise<WalletTransaction[]> {
  const res = await apiClient.get<WalletTransaction[]>('/api/payments/transactions');
  return res.data;
}

export async function initializeTopup(amount: number, redirectUrl?: string): Promise<InitializeTopupResponse> {
  const res = await apiClient.post<InitializeTopupResponse>('/api/payments/topup/initialize', { amount, redirectUrl });
  return res.data;
}

export async function verifyTopup(reference: string): Promise<WalletBalance> {
  const res = await apiClient.get<WalletBalance>(`/api/payments/topup/verify/${reference}`);
  return res.data;
}

export async function withdraw(payload: WithdrawPayload): Promise<WalletTransaction> {
  const res = await apiClient.post<WalletTransaction>('/api/payments/withdraw', payload);
  return res.data;
}
