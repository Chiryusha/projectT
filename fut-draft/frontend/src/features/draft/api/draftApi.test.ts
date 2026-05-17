jest.mock("@/shared/api", () => ({
  apiRequest: jest.fn(),
  createAuthHeaders: jest.fn((accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
  })),
}));

import { apiRequest, createAuthHeaders } from "@/shared/api";

import {
  createDraftSessionRequest,
  getFormationsRequest,
  getSlotOptionsRequest,
  getTournamentRequest,
  pickPlayerRequest,
  startTournamentRequest,
  swapPicksRequest,
} from "./draftApi";

describe("draftApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiRequest).mockResolvedValue({});
  });

  it("loads available formations", async () => {
    await getFormationsRequest();

    expect(apiRequest).toHaveBeenCalledWith("/draft/formations", {
      method: "GET",
    });
  });

  it("creates draft session with selected formation", async () => {
    await createDraftSessionRequest("access-token", "4-3-3");

    expect(createAuthHeaders).toHaveBeenCalledWith("access-token");
    expect(apiRequest).toHaveBeenCalledWith("/draft/sessions", {
      body: { formation: "4-3-3" },
      headers: { Authorization: "Bearer access-token" },
      method: "POST",
    });
  });

  it("loads slot options for concrete session slot", async () => {
    await getSlotOptionsRequest("access-token", "session-id", 10);

    expect(apiRequest).toHaveBeenCalledWith("/draft/sessions/session-id/options/10", {
      headers: { Authorization: "Bearer access-token" },
      method: "GET",
    });
  });

  it("picks player into concrete slot", async () => {
    await pickPlayerRequest("access-token", "session-id", "card-id", 10);

    expect(apiRequest).toHaveBeenCalledWith("/draft/sessions/session-id/pick", {
      body: { playerCardId: "card-id", slotNo: 10 },
      headers: { Authorization: "Bearer access-token" },
      method: "POST",
    });
  });

  it("swaps two picked slots", async () => {
    await swapPicksRequest("access-token", "session-id", 3, 10);

    expect(apiRequest).toHaveBeenCalledWith("/draft/sessions/session-id/picks/swap", {
      body: { sourceSlotNo: 3, targetSlotNo: 10 },
      headers: { Authorization: "Bearer access-token" },
      method: "POST",
    });
  });

  it("starts tournament with selected ai difficulty", async () => {
    await startTournamentRequest("access-token", "session-id", "hard");

    expect(apiRequest).toHaveBeenCalledWith(
      "/draft/sessions/session-id/tournament/start",
      {
        body: { aiDifficulty: "hard" },
        headers: { Authorization: "Bearer access-token" },
        method: "POST",
      },
    );
  });

  it("loads tournament for a draft session", async () => {
    await getTournamentRequest("access-token", "session-id");

    expect(apiRequest).toHaveBeenCalledWith("/draft/sessions/session-id/tournament", {
      headers: { Authorization: "Bearer access-token" },
      method: "GET",
    });
  });
});
