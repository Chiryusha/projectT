import { create } from "zustand";

import type { UserProfile } from "@/entities/user";
import { useAuthStore } from "@/features/auth";
import { isApiError } from "@/shared/api";

import { getProfileRequest, updateProfileRequest } from "../api/profileApi";

type ProfileStatus = "idle" | "loading" | "saving";

type ProfileStore = {
  error: string | null;
  profile: UserProfile | null;
  status: ProfileStatus;
  clearError: () => void;
  loadProfile: () => Promise<void>;
  updateAvatar: (avatarUrl: string | null) => Promise<UserProfile>;
};

const getProfileErrorMessage = (error: unknown) => {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Profile request failed. Try again.";
};

const getAccessTokenOrThrow = () => {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error("You need to log in first.");
  }

  return accessToken;
};

export const useProfileStore = create<ProfileStore>((set) => ({
  error: null,
  profile: null,
  status: "idle",

  clearError: () => set({ error: null }),

  loadProfile: async () => {
    set({ error: null, status: "loading" });

    try {
      const profile = await getProfileRequest(getAccessTokenOrThrow());

      set({ profile, status: "idle" });
    } catch (error) {
      set({ error: getProfileErrorMessage(error), status: "idle" });
    }
  },

  updateAvatar: async (avatarUrl) => {
    set({ error: null, status: "saving" });

    try {
      const profile = await updateProfileRequest(
        getAccessTokenOrThrow(),
        avatarUrl,
      );

      set({ profile, status: "idle" });
      useAuthStore.getState().syncUser(profile);

      return profile;
    } catch (error) {
      set({ error: getProfileErrorMessage(error), status: "idle" });

      throw error;
    }
  },
}));
