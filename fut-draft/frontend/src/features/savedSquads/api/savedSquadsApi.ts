import type { SavedSquad } from "@/entities/saved-squad";
import { apiRequest, createAuthHeaders } from "@/shared/api";

export const getSavedSquadsRequest = async (accessToken: string) => {
  return apiRequest<SavedSquad[]>("/draft/saved-squads", {
    headers: createAuthHeaders(accessToken),
    method: "GET",
  });
};

export const saveCurrentSquadRequest = async (
  accessToken: string,
  sessionId: string,
  name?: string,
) => {
  return apiRequest<SavedSquad>(`/draft/sessions/${sessionId}/saved-squad`, {
    body: name ? { name } : {},
    headers: createAuthHeaders(accessToken),
    method: "POST",
  });
};

export const deleteSavedSquadRequest = async (
  accessToken: string,
  savedSquadId: string,
) => {
  return apiRequest<{ deletedCount: number; success: boolean }>(
    `/draft/saved-squads/${savedSquadId}`,
    {
      headers: createAuthHeaders(accessToken),
      method: "DELETE",
    },
  );
};

export const clearSavedSquadsRequest = async (accessToken: string) => {
  return apiRequest<{ deletedCount: number; success: boolean }>(
    "/draft/saved-squads",
    {
      headers: createAuthHeaders(accessToken),
      method: "DELETE",
    },
  );
};
