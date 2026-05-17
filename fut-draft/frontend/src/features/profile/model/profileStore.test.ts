import type { UserProfile } from "@/entities/user";
import { useAuthStore } from "@/features/auth";

jest.mock("../api/profileApi", () => ({
  getProfileRequest: jest.fn(),
  updateProfileRequest: jest.fn(),
}));

import { getProfileRequest, updateProfileRequest } from "../api/profileApi";
import { useProfileStore } from "./profileStore";

const profile: UserProfile = {
  avatarUrl: null,
  createdAt: "2026-05-15T10:00:00.000Z",
  email: "demo@futdraft.local",
  id: "user-id",
  nickname: "demo_user",
  stats: {
    savedSquads: 2,
    tournamentsPlayed: 4,
    tournamentsWon: 1,
  },
};

const resetStores = () => {
  useAuthStore.setState({
    accessToken: "access-token",
    error: null,
    refreshToken: "refresh-token",
    status: "authenticated",
    user: profile,
  });
  useProfileStore.setState({
    error: null,
    profile: null,
    status: "idle",
  });
};

describe("useProfileStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStores();
  });

  it("loads current user profile with access token", async () => {
    jest.mocked(getProfileRequest).mockResolvedValue(profile);

    await useProfileStore.getState().loadProfile();

    expect(getProfileRequest).toHaveBeenCalledWith("access-token");
    expect(useProfileStore.getState()).toMatchObject({
      error: null,
      profile,
      status: "idle",
    });
  });

  it("updates avatar and syncs auth user", async () => {
    const updatedProfile: UserProfile = {
      ...profile,
      avatarUrl: "data:image/png;base64,avatar",
    };

    jest.mocked(updateProfileRequest).mockResolvedValue(updatedProfile);

    await expect(
      useProfileStore.getState().updateAvatar(updatedProfile.avatarUrl),
    ).resolves.toEqual(updatedProfile);

    expect(updateProfileRequest).toHaveBeenCalledWith(
      "access-token",
      updatedProfile.avatarUrl,
    );
    expect(useProfileStore.getState().profile).toEqual(updatedProfile);
    expect(useAuthStore.getState().user).toEqual(updatedProfile);
  });

  it("exposes request errors and returns to idle status", async () => {
    jest.mocked(getProfileRequest).mockRejectedValue(new Error("Profile failed"));

    await useProfileStore.getState().loadProfile();

    expect(useProfileStore.getState()).toMatchObject({
      error: "Profile failed",
      profile: null,
      status: "idle",
    });
  });
});
