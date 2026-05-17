import type { SavedSquad } from "@/entities/saved-squad";
import { useAuthStore } from "@/features/auth";
import { mockSavedSquad } from "@/shared/testing/mockDraftData";

jest.mock("../api/savedSquadsApi", () => ({
  clearSavedSquadsRequest: jest.fn(),
  deleteSavedSquadRequest: jest.fn(),
  getSavedSquadsRequest: jest.fn(),
  saveCurrentSquadRequest: jest.fn(),
}));

import {
  clearSavedSquadsRequest,
  deleteSavedSquadRequest,
  getSavedSquadsRequest,
  saveCurrentSquadRequest,
} from "../api/savedSquadsApi";
import { useSavedSquadsStore } from "./savedSquadsStore";

const secondSquad: SavedSquad = {
  ...mockSavedSquad,
  id: "second-squad-id",
  name: "Second Squad",
  sessionId: "second-session-id",
};

const resetStores = () => {
  useAuthStore.setState({
    accessToken: "access-token",
    error: null,
    refreshToken: "refresh-token",
    status: "authenticated",
    user: null,
  });
  useSavedSquadsStore.setState({
    error: null,
    savedSquads: [],
    status: "idle",
  });
};

describe("useSavedSquadsStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStores();
  });

  it("loads saved squads with access token", async () => {
    jest.mocked(getSavedSquadsRequest).mockResolvedValue([mockSavedSquad]);

    await useSavedSquadsStore.getState().loadSavedSquads();

    expect(getSavedSquadsRequest).toHaveBeenCalledWith("access-token");
    expect(useSavedSquadsStore.getState()).toMatchObject({
      error: null,
      savedSquads: [mockSavedSquad],
      status: "idle",
    });
  });

  it("saves current squad at the beginning and avoids duplicates by id", async () => {
    const updatedSquad = {
      ...mockSavedSquad,
      name: "Updated Squad",
    };

    jest.mocked(saveCurrentSquadRequest).mockResolvedValue(updatedSquad);
    useSavedSquadsStore.setState({
      savedSquads: [mockSavedSquad, secondSquad],
    });

    await expect(
      useSavedSquadsStore.getState().saveCurrentSquad("session-id", "Updated Squad"),
    ).resolves.toEqual(updatedSquad);

    expect(saveCurrentSquadRequest).toHaveBeenCalledWith(
      "access-token",
      "session-id",
      "Updated Squad",
    );
    expect(useSavedSquadsStore.getState().savedSquads).toEqual([
      updatedSquad,
      secondSquad,
    ]);
  });

  it("deletes one saved squad from the local list", async () => {
    jest.mocked(deleteSavedSquadRequest).mockResolvedValue({
      deletedCount: 1,
      success: true,
    });
    useSavedSquadsStore.setState({
      savedSquads: [mockSavedSquad, secondSquad],
    });

    await useSavedSquadsStore.getState().deleteSavedSquad(mockSavedSquad.id);

    expect(deleteSavedSquadRequest).toHaveBeenCalledWith(
      "access-token",
      mockSavedSquad.id,
    );
    expect(useSavedSquadsStore.getState().savedSquads).toEqual([secondSquad]);
  });

  it("clears all saved squads", async () => {
    jest.mocked(clearSavedSquadsRequest).mockResolvedValue({
      deletedCount: 2,
      success: true,
    });
    useSavedSquadsStore.setState({
      savedSquads: [mockSavedSquad, secondSquad],
    });

    await useSavedSquadsStore.getState().clearSavedSquads();

    expect(clearSavedSquadsRequest).toHaveBeenCalledWith("access-token");
    expect(useSavedSquadsStore.getState().savedSquads).toEqual([]);
  });

  it("keeps current list and exposes an error when delete fails", async () => {
    jest.mocked(deleteSavedSquadRequest).mockRejectedValue(new Error("Delete failed"));
    useSavedSquadsStore.setState({
      savedSquads: [mockSavedSquad],
    });

    await expect(
      useSavedSquadsStore.getState().deleteSavedSquad(mockSavedSquad.id),
    ).rejects.toThrow("Delete failed");

    expect(useSavedSquadsStore.getState()).toMatchObject({
      error: "Delete failed",
      savedSquads: [mockSavedSquad],
      status: "idle",
    });
  });
});
