import { create } from "zustand";

import { isApiError } from "@/shared/api";

import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
} from "../api/authApi";
import type {
  AuthResponse,
  AuthUser,
  AuthStatus,
  LoginPayload,
  RegisterPayload,
} from "./types";

export const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
export const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";
export const AUTH_USER_STORAGE_KEY = "authUser";


type AuthStore = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  error: string | null;
  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  syncUser: (user: AuthUser) => void;
  clearError: () => void;
};

const canUseStorage = () =>
  typeof window !== "undefined" && Boolean(window.localStorage);

export const getAccessToken = (): string | null => {
  if (!canUseStorage()) {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

const getRefreshToken = (): string | null => {
  if (!canUseStorage()) {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};

const getStoredUser = (): AuthUser | null => {
  if (!canUseStorage()) {
    return null;
  }

  const rawUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);

    return null;
  }
};

const persistSession = ({ tokens, user }: AuthResponse) => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
};

const persistUser = (user: AuthUser) => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
};

const clearStoredSession = () => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

const getAuthErrorMessage = (error: unknown) => {
  if (isApiError(error)) {
    if (error.status === 401) {
      return "Invalid email or password";
    }

    return error.message;
  }

  return "Something went wrong. Try again.";
};

const applyAuthResponse = (response: AuthResponse) => {
  persistSession(response);

  useAuthStore.setState({
    user: response.user,
    accessToken: response.tokens.accessToken,
    refreshToken: response.tokens.refreshToken,
    status: "authenticated",
    error: null,
  });

  return response.user;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: getStoredUser(),
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  status: getAccessToken() ? "checking" : "guest",
  error: null,

  initialize: async () => {
    const { accessToken, refreshToken, status } = get();

    if (status !== "checking") {
      return;
    }

    if (!accessToken) {
      clearStoredSession();
      set({ user: null, refreshToken: null, status: "guest", error: null });

      return;
    }

    try {
      const user = await meRequest(accessToken);
      set({ user, status: "authenticated", error: null });
    } catch {
      if (!refreshToken) {
        clearStoredSession();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: "guest",
          error: null,
        });

        return;
      }

      try {
        const refreshedSession = await refreshRequest(refreshToken);
        applyAuthResponse(refreshedSession);
      } catch {
        clearStoredSession();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: "guest",
          error: null,
        });
      }
    }
  },

  login: async (payload) => {
    set({ status: "loading", error: null });

    try {
      const response = await loginRequest(payload);

      return applyAuthResponse(response);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      clearStoredSession();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        status: "guest",
        error: message,
      });

      throw error;
    }
  },

  register: async (payload) => {
    set({ status: "loading", error: null });

    try {
      const response = await registerRequest(payload);

      return applyAuthResponse(response);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      clearStoredSession();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        status: "guest",
        error: message,
      });

      throw error;
    }
  },

  logout: async () => {
    const { accessToken } = get();

    if (accessToken) {
      try {
        await logoutRequest(accessToken);
      } catch {
        // Local logout still wins if the token is already dead.
      }
    }

    clearStoredSession();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: "guest",
      error: null,
    });
  },

  syncUser: (user) => {
    persistUser(user);
    set({ user });
  },

  clearError: () => set({ error: null }),
}));

export const isAuthenticated = (): boolean => {
  return Boolean(useAuthStore.getState().accessToken ?? getAccessToken());
};
