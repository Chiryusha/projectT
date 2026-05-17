import { apiRequest, createAuthHeaders } from "@/shared/api";
import type { AiDifficulty } from "@/shared/config/gameSettings";

import type {
  DraftFormation,
  DraftPickResponse,
  DraftSessionState,
  TournamentResponse,
} from "../model/types";

export const getFormationsRequest = async () => {
  return apiRequest<DraftFormation[]>("/draft/formations", {
    method: "GET",
  });
};

export const createDraftSessionRequest = async (
  accessToken: string,
  formation: string,
) => {
  return apiRequest<DraftSessionState>("/draft/sessions", {
    body: { formation },
    headers: createAuthHeaders(accessToken),
    method: "POST",
  });
};

export const getDraftSessionRequest = async (
  accessToken: string,
  sessionId: string,
) => {
  return apiRequest<DraftSessionState>(`/draft/sessions/${sessionId}`, {
    headers: createAuthHeaders(accessToken),
    method: "GET",
  });
};

export const getSlotOptionsRequest = async (
  accessToken: string,
  sessionId: string,
  slotNo: number,
) => {
  return apiRequest<DraftSessionState>(`/draft/sessions/${sessionId}/options/${slotNo}`, {
    headers: createAuthHeaders(accessToken),
    method: "GET",
  });
};

export const pickPlayerRequest = async (
  accessToken: string,
  sessionId: string,
  playerCardId: string,
  slotNo: number,
) => {
  return apiRequest<DraftPickResponse>(`/draft/sessions/${sessionId}/pick`, {
    body: { playerCardId, slotNo },
    headers: createAuthHeaders(accessToken),
    method: "POST",
  });
};

export const swapPicksRequest = async (
  accessToken: string,
  sessionId: string,
  sourceSlotNo: number,
  targetSlotNo: number,
) => {
  return apiRequest<DraftSessionState>(`/draft/sessions/${sessionId}/picks/swap`, {
    body: { sourceSlotNo, targetSlotNo },
    headers: createAuthHeaders(accessToken),
    method: "POST",
  });
};

export const startTournamentRequest = async (
  accessToken: string,
  sessionId: string,
  aiDifficulty: AiDifficulty,
) => {
  return apiRequest<TournamentResponse>(
    `/draft/sessions/${sessionId}/tournament/start`,
    {
      body: { aiDifficulty },
      headers: createAuthHeaders(accessToken),
      method: "POST",
    },
  );
};

export const getTournamentRequest = async (
  accessToken: string,
  sessionId: string,
) => {
  return apiRequest<TournamentResponse>(`/draft/sessions/${sessionId}/tournament`, {
    headers: createAuthHeaders(accessToken),
    method: "GET",
  });
};
