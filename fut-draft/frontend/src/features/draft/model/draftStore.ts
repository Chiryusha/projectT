import { create } from "zustand";

import { useAuthStore } from "@/features/auth";
import { isApiError } from "@/shared/api";
import type { AiDifficulty } from "@/shared/config/gameSettings";

import {
  createDraftSessionRequest,
  getFormationsRequest,
  getSlotOptionsRequest,
  getTournamentRequest,
  pickPlayerRequest,
  startTournamentRequest,
  swapPicksRequest,
} from "../api/draftApi";
import type {
  DraftFormation,
  DraftPlayerCard,
  DraftSessionState,
  DraftStatus,
  TournamentResponse,
} from "./types";

type DraftStore = {
  formations: DraftFormation[];
  selectedFormationCode: string | null;
  sessionState: DraftSessionState | null;
  tournament: TournamentResponse | null;
  status: DraftStatus;
  error: string | null;
  loadFormations: () => Promise<void>;
  selectFormation: (formationCode: string) => void;
  createSession: () => Promise<void>;
  loadSlotOptions: (slotNo: number) => Promise<void>;
  pickPlayer: (playerCardId: DraftPlayerCard["id"], slotNo: number) => Promise<void>;
  swapPicks: (sourceSlotNo: number, targetSlotNo: number) => Promise<void>;
  startTournament: (aiDifficulty: AiDifficulty) => Promise<TournamentResponse>;
  loadTournament: (sessionId: string) => Promise<void>;
  resetDraft: () => void;
  clearError: () => void;
};

const getDraftErrorMessage = (error: unknown) => {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Draft action failed. Try again.";
};

const getAccessTokenOrThrow = () => {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error("You need to log in before starting a draft.");
  }

  return accessToken;
};

export const useDraftStore = create<DraftStore>((set, get) => ({
  formations: [],
  selectedFormationCode: null,
  sessionState: null,
  tournament: null,
  status: "idle",
  error: null,

  loadFormations: async () => {
    const { formations, status } = get();

    if (formations.length > 0 || status === "loading") {
      return;
    }

    set({ status: "loading", error: null });

    try {
      const nextFormations = await getFormationsRequest();

      set({
        formations: nextFormations,
        selectedFormationCode: nextFormations[0]?.code ?? null,
        status: "idle",
      });
    } catch (error) {
      set({ status: "idle", error: getDraftErrorMessage(error) });
    }
  },

  selectFormation: (formationCode) => {
    set({ selectedFormationCode: formationCode, error: null });
  },

  createSession: async () => {
    const { selectedFormationCode } = get();

    if (!selectedFormationCode) {
      set({ error: "Choose a formation first." });

      return;
    }

    set({ status: "creating", error: null, tournament: null });

    try {
      const sessionState = await createDraftSessionRequest(
        getAccessTokenOrThrow(),
        selectedFormationCode,
      );

      set({
        sessionState,
        selectedFormationCode: sessionState.session.formation,
        status: "idle",
      });
    } catch (error) {
      set({ status: "idle", error: getDraftErrorMessage(error) });
    }
  },

  loadSlotOptions: async (slotNo) => {
    const { sessionState } = get();

    if (!sessionState) {
      return;
    }

    set({ status: "loading-options", error: null });

    try {
      const nextSessionState = await getSlotOptionsRequest(
        getAccessTokenOrThrow(),
        sessionState.session.id,
        slotNo,
      );

      set({
        sessionState: nextSessionState,
        status: "idle",
      });
    } catch (error) {
      set({ status: "idle", error: getDraftErrorMessage(error) });
    }
  },

  pickPlayer: async (playerCardId, slotNo) => {
    const { sessionState } = get();

    if (!sessionState) {
      return;
    }

    set({ status: "picking", error: null });

    try {
      const nextSessionState = await pickPlayerRequest(
        getAccessTokenOrThrow(),
        sessionState.session.id,
        playerCardId,
        slotNo,
      );

      set({
        sessionState: nextSessionState,
        status: "idle",
      });
    } catch (error) {
      set({ status: "idle", error: getDraftErrorMessage(error) });
    }
  },

  swapPicks: async (sourceSlotNo, targetSlotNo) => {
    const { sessionState } = get();

    if (!sessionState || sourceSlotNo === targetSlotNo) {
      return;
    }

    set({ status: "swapping", error: null });

    try {
      const nextSessionState = await swapPicksRequest(
        getAccessTokenOrThrow(),
        sessionState.session.id,
        sourceSlotNo,
        targetSlotNo,
      );

      set({
        sessionState: nextSessionState,
        status: "idle",
      });
    } catch (error) {
      set({ status: "idle", error: getDraftErrorMessage(error) });
    }
  },

  startTournament: async (aiDifficulty) => {
    const { sessionState } = get();

    if (!sessionState) {
      throw new Error("Create a draft before starting tournament.");
    }

    set({ status: "starting-tournament", error: null });

    try {
      const tournament = await startTournamentRequest(
        getAccessTokenOrThrow(),
        sessionState.session.id,
        aiDifficulty,
      );

      set((state) => ({
        sessionState: state.sessionState
          ? {
              ...state.sessionState,
              session: {
                ...state.sessionState.session,
                tournamentId: tournament.tournament.id,
              },
            }
          : state.sessionState,
        tournament,
        status: "idle",
      }));

      return tournament;
    } catch (error) {
      const message = getDraftErrorMessage(error);
      set({ status: "idle", error: message });

      throw error;
    }
  },

  loadTournament: async (sessionId) => {
    set({ status: "loading", error: null });

    try {
      const tournament = await getTournamentRequest(
        getAccessTokenOrThrow(),
        sessionId,
      );

      set((state) => ({
        sessionState:
          state.sessionState?.session.id === sessionId
            ? {
                ...state.sessionState,
                session: {
                  ...state.sessionState.session,
                  tournamentId: tournament.tournament.id,
                },
              }
            : state.sessionState,
        tournament,
        status: "idle",
      }));
    } catch (error) {
      set({ status: "idle", error: getDraftErrorMessage(error) });
    }
  },

  resetDraft: () => {
    set({
      sessionState: null,
      tournament: null,
      error: null,
      status: "idle",
    });
  },

  clearError: () => set({ error: null }),
}));
