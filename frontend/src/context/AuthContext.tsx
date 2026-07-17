import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as authService from '../services/authService';
import type { AuthUser, RegisterPayload, ResendVerificationResult, ForgotPasswordResult } from '../services/authService';
import { loadPersistedTokens, setTokens, clearTokens, getRefreshToken, setUnauthorizedHandler } from '../api/client';
import { unregisterPushToken } from '../services/notificationService';
import { lastKnownPushToken } from '../hooks/usePushNotifications';

const ONBOARDED_STATUSES: AuthUser['verificationStatus'][] = ['face_verified', 'fully_verified'];

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<ResendVerificationResult>;
  uploadStudentId: (uri: string) => Promise<void>;
  uploadFacePhoto: (uri: string) => Promise<void>;
  updateProfile: (data: { fullName?: string; bio?: string }) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<ForgotPasswordResult>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });

    (async () => {
      try {
        const { refreshToken } = await loadPersistedTokens();
        if (refreshToken) {
          const me = await authService.fetchCurrentUser();
          setUser(me);
          setHasCompletedOnboarding(ONBOARDED_STATUSES.includes(me.verificationStatus));
        }
      } catch (error) {
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await authService.register(payload);
    await setTokens(result);
    setUser(result.user);
    setHasCompletedOnboarding(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    await setTokens(result);
    setUser(result.user);
    setHasCompletedOnboarding(ONBOARDED_STATUSES.includes(result.user.verificationStatus));
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (lastKnownPushToken) {
        await unregisterPushToken(lastKnownPushToken);
      }
    } catch (error) {
      // Best-effort, same as the authService.logout call below: even if the network call fails,
      // drop local session state anyway.
    }
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      // Logout is best-effort: even if the network call fails, drop local session state.
    } finally {
      await clearTokens();
      setUser(null);
      setHasCompletedOnboarding(false);
    }
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    const updated = await authService.verifyEmail(code);
    setUser(updated);
  }, []);

  const resendVerification = useCallback(async () => {
    return authService.resendVerification();
  }, []);

  const uploadStudentId = useCallback(async (uri: string) => {
    const updated = await authService.uploadStudentId(uri);
    setUser(updated);
  }, []);

  const uploadFacePhoto = useCallback(async (uri: string) => {
    const updated = await authService.uploadFacePhoto(uri);
    setUser(updated);
  }, []);

  const updateProfile = useCallback(async (data: { fullName?: string; bio?: string }) => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
  }, []);

  const uploadAvatar = useCallback(async (uri: string) => {
    const updated = await authService.uploadAvatar(uri);
    setUser(updated);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    return authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await authService.resetPassword(token, newPassword);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authService.fetchCurrentUser();
    setUser(me);
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      hasCompletedOnboarding,
      register,
      login,
      logout,
      verifyEmail,
      resendVerification,
      uploadStudentId,
      uploadFacePhoto,
      updateProfile,
      uploadAvatar,
      forgotPassword,
      resetPassword,
      refreshUser,
      completeOnboarding,
    }),
    [
      user,
      isLoading,
      hasCompletedOnboarding,
      register,
      login,
      logout,
      verifyEmail,
      resendVerification,
      uploadStudentId,
      uploadFacePhoto,
      updateProfile,
      uploadAvatar,
      forgotPassword,
      resetPassword,
      refreshUser,
      completeOnboarding,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
