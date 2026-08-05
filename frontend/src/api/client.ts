import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    'EXPO_PUBLIC_API_URL is not set. Create frontend/.env.local from .env.example and restart Metro (npx expo start -c).'
  );
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
  onSessionExpired = fn;
}

export async function loadPersistedTokens() {
  accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  return { accessToken, refreshToken };
}

export function getRefreshToken() {
  return refreshToken;
}

/** For endpoints React Native's <Image> hits directly (bypassing apiClient's interceptor) but that still require auth, e.g. chat images - see ChatDetailScreen. */
export function getAccessToken() {
  return accessToken;
}

export function getApiUrl() {
  return API_URL;
}

export async function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;

    const isRefreshCall = original?.url?.includes('/api/auth/refresh');
    if (error.response?.status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = doRefresh();
        }
        const newAccessToken = await refreshPromise;
        refreshPromise = null;
        original.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient(original);
      } catch (refreshError) {
        refreshPromise = null;
        await clearTokens();
        onSessionExpired?.();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

async function doRefresh(): Promise<string> {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  // Bare axios call (not apiClient) so this doesn't recurse through the request/response interceptors above.
  const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
  await setTokens(res.data);
  return res.data.accessToken;
}
