import type { UserProfile } from "@/entities/user";
import { apiRequest, createAuthHeaders } from "@/shared/api";

export const getProfileRequest = async (accessToken: string) => {
  return apiRequest<UserProfile>("/users/me", {
    headers: createAuthHeaders(accessToken),
    method: "GET",
  });
};

export const updateProfileRequest = async (
  accessToken: string,
  avatarUrl: string | null,
) => {
  return apiRequest<UserProfile>("/users/me", {
    body: { avatarUrl },
    headers: createAuthHeaders(accessToken),
    method: "PATCH",
  });
};
