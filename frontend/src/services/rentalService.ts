import { apiClient } from '../api/client';

// rentals-service serializes enums lowercase (same convention as TaskStatus/TaskCategory in
// taskService.ts) - unlike payments-service, which uses uppercase (see walletService.ts). Verified
// against the real running backend, not just the API contract doc.
export type ListingType = 'rental' | 'barter';
export type ListingStatus = 'active' | 'closed';
export type ListingOfferType = 'cash' | 'barter';
export type ListingOfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface ListingUserSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  verified: boolean;
}

export interface ListingItem {
  id: string;
  owner: ListingUserSummary;
  type: ListingType;
  title: string;
  description: string;
  dailyRate: number | null;
  barterAccepted: boolean;
  offering: string | null;
  seeking: string | null;
  status: ListingStatus;
  createdAt: string;
  /** Total offers received — only meaningful when you're the owner (see myOfferStatus otherwise). */
  offerCount: number;
  /** Your own latest non-withdrawn offer on this listing, or null if you haven't made one / are the owner. */
  myOfferStatus: ListingOfferStatus | null;
  /** The id of that same offer (for withdrawOffer), or null alongside myOfferStatus. */
  myOfferId: string | null;
}

export interface ListingOfferItem {
  id: string;
  listingId: string;
  requester: ListingUserSummary;
  offerType: ListingOfferType;
  durationDays: number | null;
  barterMessage: string | null;
  status: ListingOfferStatus;
  createdAt: string;
}

export interface CreateListingPayload {
  type: ListingType;
  title: string;
  description: string;
  dailyRate?: number;
  barterAccepted?: boolean;
  offering?: string;
  seeking?: string;
}

export interface MakeOfferPayload {
  offerType: ListingOfferType;
  durationDays?: number;
  barterMessage?: string;
}

export interface AcceptOfferResult {
  offer: ListingOfferItem;
  paymentFailed: boolean;
  paymentFailureReason: string | null;
}

export async function createListing(payload: CreateListingPayload): Promise<ListingItem> {
  const res = await apiClient.post<ListingItem>('/api/listings', payload);
  return res.data;
}

export async function getListings(type?: 'rental' | 'barter'): Promise<ListingItem[]> {
  const res = await apiClient.get<ListingItem[]>('/api/listings', { params: type ? { type } : undefined });
  return res.data;
}

export async function getListing(id: string): Promise<ListingItem> {
  const res = await apiClient.get<ListingItem>(`/api/listings/${id}`);
  return res.data;
}

export async function getMyListings(): Promise<ListingItem[]> {
  const res = await apiClient.get<ListingItem[]>('/api/listings/mine');
  return res.data;
}

export async function makeOffer(listingId: string, payload: MakeOfferPayload): Promise<ListingOfferItem> {
  const res = await apiClient.post<ListingOfferItem>(`/api/listings/${listingId}/offers`, payload);
  return res.data;
}

export async function getOffersForListing(listingId: string): Promise<ListingOfferItem[]> {
  const res = await apiClient.get<ListingOfferItem[]>(`/api/listings/${listingId}/offers`);
  return res.data;
}

export async function acceptOffer(offerId: string): Promise<AcceptOfferResult> {
  const res = await apiClient.post<AcceptOfferResult>(`/api/offers/${offerId}/accept`);
  return res.data;
}

export async function rejectOffer(offerId: string): Promise<ListingOfferItem> {
  const res = await apiClient.post<ListingOfferItem>(`/api/offers/${offerId}/reject`);
  return res.data;
}

export async function withdrawOffer(offerId: string): Promise<ListingOfferItem> {
  const res = await apiClient.post<ListingOfferItem>(`/api/offers/${offerId}/withdraw`);
  return res.data;
}
