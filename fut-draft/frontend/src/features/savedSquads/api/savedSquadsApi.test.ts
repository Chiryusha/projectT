jest.mock("@/shared/api", () => ({
  apiRequest: jest.fn(),
  createAuthHeaders: jest.fn((accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
  })),
}));

import { apiRequest, createAuthHeaders } from "@/shared/api";

import {
  clearSavedSquadsRequest,
  deleteSavedSquadRequest,
  getSavedSquadsRequest,
  saveCurrentSquadRequest,
} from "./savedSquadsApi";

describe("savedSquadsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiRequest).mockResolvedValue({});
  });

  it("loads saved squads with auth headers", async () => {
    await getSavedSquadsRequest("access-token");

    expect(createAuthHeaders).toHaveBeenCalledWith("access-token");
    expect(apiRequest).toHaveBeenCalledWith("/draft/saved-squads", {
      headers: { Authorization: "Bearer access-token" },
      method: "GET",
    });
  });

  it("saves current squad with optional name", async () => {
    await saveCurrentSquadRequest("access-token", "session-id", "My Draft");

    expect(apiRequest).toHaveBeenCalledWith(
      "/draft/sessions/session-id/saved-squad",
      {
        body: { name: "My Draft" },
        headers: { Authorization: "Bearer access-token" },
        method: "POST",
      },
    );
  });

  it("saves current squad with empty body when name is omitted", async () => {
    await saveCurrentSquadRequest("access-token", "session-id");

    expect(apiRequest).toHaveBeenCalledWith(
      "/draft/sessions/session-id/saved-squad",
      {
        body: {},
        headers: { Authorization: "Bearer access-token" },
        method: "POST",
      },
    );
  });

  it("deletes one saved squad", async () => {
    await deleteSavedSquadRequest("access-token", "saved-squad-id");

    expect(apiRequest).toHaveBeenCalledWith("/draft/saved-squads/saved-squad-id", {
      headers: { Authorization: "Bearer access-token" },
      method: "DELETE",
    });
  });

  it("clears all saved squads", async () => {
    await clearSavedSquadsRequest("access-token");

    expect(apiRequest).toHaveBeenCalledWith("/draft/saved-squads", {
      headers: { Authorization: "Bearer access-token" },
      method: "DELETE",
    });
  });
});
