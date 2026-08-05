import { apiClient } from '../api/client';

export type ReportReasonCategory =
  | 'harassment'
  | 'scam_fraud'
  | 'inappropriate_content'
  | 'no_show'
  | 'fake_listing'
  | 'other';

export const REPORT_REASON_OPTIONS: { id: ReportReasonCategory; label: string }[] = [
  { id: 'harassment', label: 'Harassment or abuse' },
  { id: 'scam_fraud', label: 'Scam or fraud' },
  { id: 'inappropriate_content', label: 'Inappropriate content' },
  { id: 'no_show', label: 'No-show / didn’t follow through' },
  { id: 'fake_listing', label: 'Fake listing or task' },
  { id: 'other', label: 'Something else' },
];

export interface CreateReportPayload {
  reportedUserId: string;
  reasonCategory: ReportReasonCategory;
  description: string;
}

export async function reportUser(payload: CreateReportPayload): Promise<void> {
  await apiClient.post('/api/reports', payload);
}
