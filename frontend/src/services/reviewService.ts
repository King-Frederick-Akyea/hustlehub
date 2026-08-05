import { apiClient } from '../api/client';

export type EngagementType = 'task' | 'rental_offer';

export interface ReviewUserSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  verified: boolean;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewer: ReviewUserSummary;
  revieweeId: string;
  relatedType: EngagementType;
  relatedId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface EligibleEngagement {
  relatedType: EngagementType;
  relatedId: string;
  otherParty: ReviewUserSummary;
  engagedAt: string;
}

export interface CreateReviewPayload {
  revieweeId: string;
  relatedType: EngagementType;
  relatedId: string;
  rating: number;
  comment?: string;
}

export async function getReviewsForUser(userId: string): Promise<Review[]> {
  const res = await apiClient.get<Review[]>(`/api/reviews/user/${userId}`);
  return res.data;
}

export async function getEligibleEngagements(): Promise<EligibleEngagement[]> {
  const res = await apiClient.get<EligibleEngagement[]>('/api/reviews/eligible');
  return res.data;
}

export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  const res = await apiClient.post<Review>('/api/reviews', payload);
  return res.data;
}
