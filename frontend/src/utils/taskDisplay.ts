import { TASK_CATEGORIES } from '../constants';
import type { TaskCategoryId } from '../services/taskService';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/** Avatar URLs from the backend are relative (e.g. "/api/users/{id}/avatar") — this resolves them to a loadable URI. */
export function resolveAvatarUrl(avatarUrl: string | null | undefined): string | undefined {
  return avatarUrl ? `${API_URL}${avatarUrl}` : undefined;
}

const CATEGORY_COLORS: Record<TaskCategoryId, string> = {
  grocery: '#FF6B6B',
  laundry: '#4ECDC4',
  documents: '#A78BFA',
  queue: '#F59E0B',
  delivery: '#FF6B6B',
  tutoring: '#4ECDC4',
  cleaning: '#34D399',
  tech: '#96CEB4',
  moving: '#45B7D1',
  other: '#9CA3AF',
};

export function categoryMeta(id: TaskCategoryId) {
  const entry = TASK_CATEGORIES.find((c) => c.id === id);
  return {
    label: entry?.label ?? id,
    icon: entry?.icon ?? 'ellipsis-horizontal',
    color: CATEGORY_COLORS[id] ?? '#9CA3AF',
  };
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/** Great-circle distance between two coordinates, in kilometers. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Once a task is assigned, both parties track it on the Active Task screen instead of Task Details. */
export function taskDetailRoute(status: string): 'ActiveTask' | 'TaskDetails' {
  return status === 'in_progress' || status === 'completed' ? 'ActiveTask' : 'TaskDetails';
}
