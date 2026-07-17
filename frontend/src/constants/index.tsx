// Export all constants
export { colors } from './colors';
export { typography, textStyles } from './typography';
export { spacing, borderRadius, shadows } from './spacing';

// App-wide constants
export const APP_NAME = 'HustleHub';
export const APP_VERSION = '1.0.0';

// Task Categories
export const TASK_CATEGORIES = [
  { id: 'grocery', label: 'Grocery Shopping', icon: 'cart' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt' },
  { id: 'documents', label: 'Document Submission', icon: 'document-text' },
  { id: 'queue', label: 'Queue Standing', icon: 'people' },
  { id: 'delivery', label: 'Delivery', icon: 'bicycle' },
  { id: 'tutoring', label: 'Tutoring', icon: 'school' },
  { id: 'cleaning', label: 'Cleaning', icon: 'sparkles' },
  { id: 'tech', label: 'Tech Help', icon: 'laptop' },
  { id: 'moving', label: 'Moving Help', icon: 'cube' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
] as const;

// Rental Categories
export const RENTAL_CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: 'laptop' },
  { id: 'books', label: 'Books', icon: 'book' },
  { id: 'tools', label: 'Tools', icon: 'hammer' },
  { id: 'clothing', label: 'Clothing', icon: 'shirt' },
  { id: 'sports', label: 'Sports Equipment', icon: 'football' },
  { id: 'musical', label: 'Musical Instruments', icon: 'musical-notes' },
  { id: 'furniture', label: 'Furniture', icon: 'bed' },
  { id: 'kitchen', label: 'Kitchen Items', icon: 'restaurant' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

// Task Status
export const TASK_STATUS = {
  OPEN: 'open',
  BIDDING: 'bidding',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
};

// Verification Status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  EMAIL_VERIFIED: 'email_verified',
  ID_SUBMITTED: 'id_submitted',
  ID_VERIFIED: 'id_verified',
  FACE_VERIFIED: 'face_verified',
  FULLY_VERIFIED: 'fully_verified',
  REJECTED: 'rejected',
};

// User Roles
export const USER_ROLES = {
  HIRE: 'hire',
  TASKER: 'tasker',
  BOTH: 'both',
};

// Bid Status
export const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

// Transaction Types
export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  PAYMENT: 'payment',
  EARNING: 'earning',
  ESCROW_HOLD: 'escrow_hold',
  ESCROW_RELEASE: 'escrow_release',
  REFUND: 'refund',
};

// Time constants
export const BIDDING_WINDOW_HOURS = 12;
export const RENTAL_BIDDING_HOURS = 12;
