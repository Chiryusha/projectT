import { apiRequest, createAuthHeaders } from "@/shared/api";

import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "../model/types";

export const loginRequest = async (payload: LoginPayload) => {
  return apiRequest<AuthResponse>("/auth/login", {
    body: payload,
    method: "POST",
  });
};

export const registerRequest = async (payload: RegisterPayload) => {
  return apiRequest<AuthResponse>("/auth/register", {
    body: payload,
    method: "POST",
  });
};

export const refreshRequest = async (refreshToken: string) => {
  return apiRequest<AuthResponse>("/auth/refresh", {
    body: { refreshToken },
    method: "POST",
  });
};

export const meRequest = async (accessToken: string) => {
  return apiRequest<AuthUser>("/auth/me", {
    headers: createAuthHeaders(accessToken),
    method: "GET",
  });
};

export const logoutRequest = async (accessToken: string) => {
  return apiRequest<{ success: boolean }>("/auth/logout", {
    headers: createAuthHeaders(accessToken),
    method: "POST",
  });
};
