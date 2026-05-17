import { create } from "zustand";

import type { SavedSquad } from "@/entities/saved-squad";
import { useAuthStore } from "@/features/auth";
import { isApiError } from "@/shared/api";

import {
  clearSavedSquadsRequest,
  deleteSavedSquadRequest,
  getSavedSquadsRequest,
  saveCurrentSquadRequest,
} from "../api/savedSquadsApi";

type SavedSquadsStatus = "idle" | "loading" | "saving" | "deleting";

type SavedSquadsStore = {
  error: string | null;
  savedSquads: SavedSquad[];
  status: SavedSquadsStatus;
  clearError: () => void;
  clearSavedSquads: () => Promise<void>;
  deleteSavedSquad: (savedSquadId: string) => Promise<void>;
  loadSavedSquads: () => Promise<void>;
  saveCurrentSquad: (sessionId: string, name?: string) => Promise<SavedSquad>;
};

const getSavedSquadsErrorMessage = (error: unknown) => {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Saved squads request failed. Try again.";
};

const getAccessTokenOrThrow = () => {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error("You need to log in first.");
  }

  return accessToken;
};

export const useSavedSquadsStore = create<SavedSquadsStore>((set, get) => ({
  error: null,
  savedSquads: [],
  status: "idle",

  clearError: () => set({ error: null }),

  clearSavedSquads: async () => {
    set({ error: null, status: "deleting" });

    try {
      await clearSavedSquadsRequest(getAccessTokenOrThrow());

      set({ savedSquads: [], status: "idle" });
    } catch (error) {
      set({ error: getSavedSquadsErrorMessage(error), status: "idle" });

      throw error;
    }
  },

  deleteSavedSquad: async (savedSquadId) => {
    set({ error: null, status: "deleting" });

    try {
      await deleteSavedSquadRequest(getAccessTokenOrThrow(), savedSquadId);

      set({
        savedSquads: get().savedSquads.filter(
          (squad) => squad.id !== savedSquadId,
        ),
        status: "idle",
      });
    } catch (error) {
      set({ error: getSavedSquadsErrorMessage(error), status: "idle" });

      throw error;
    }
  },

  loadSavedSquads: async () => {
    set({ error: null, status: "loading" });

    try {
      const savedSquads = await getSavedSquadsRequest(getAccessTokenOrThrow());

      set({ savedSquads, status: "idle" });
    } catch (error) {
      set({ error: getSavedSquadsErrorMessage(error), status: "idle" });
    }
  },

  saveCurrentSquad: async (sessionId, name) => {
    set({ error: null, status: "saving" });

    try {
      const savedSquad = await saveCurrentSquadRequest(
        getAccessTokenOrThrow(),
        sessionId,
        name,
      );
      const otherSquads = get().savedSquads.filter(
        (squad) => squad.id !== savedSquad.id,
      );

      set({
        savedSquads: [savedSquad, ...otherSquads],
        status: "idle",
      });

      return savedSquad;
    } catch (error) {
      set({ error: getSavedSquadsErrorMessage(error), status: "idle" });

      throw error;
    }
  },
}));
