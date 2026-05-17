import { useAuthStore } from "@/features/auth";
import {
  createMockDraftSessionState,
  mockCompletedDraftSessionState,
  mockTournamentChampion,
} from "@/features/draft/testing/mockDraftState";
import { mockFormation, mockFormations } from "@/shared/testing/mockDraftData";

jest.mock("../api/draftApi", () => ({
  createDraftSessionRequest: jest.fn(),
  getFormationsRequest: jest.fn(),
  getSlotOptionsRequest: jest.fn(),
  getTournamentRequest: jest.fn(),
  pickPlayerRequest: jest.fn(),
  startTournamentRequest: jest.fn(),
  swapPicksRequest: jest.fn(),
}));

import {
  createDraftSessionRequest,
  getFormationsRequest,
  getSlotOptionsRequest,
  getTournamentRequest,
  startTournamentRequest,
  swapPicksRequest,
} from "../api/draftApi";
import { useDraftStore } from "./draftStore";

const resetStores = () => {
  useAuthStore.setState({
    accessToken: "access-token",
    error: null,
    refreshToken: "refresh-token",
    status: "authenticated",
    user: null,
  });
  useDraftStore.setState({
    error: null,
    formations: [],
    selectedFormationCode: null,
    sessionState: null,
    status: "idle",
    tournament: null,
  });
};

describe("useDraftStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStores();
  });

  it("loads formations and selects the first one", async () => {
    jest.mocked(getFormationsRequest).mockResolvedValue(mockFormations);

    await useDraftStore.getState().loadFormations();

    expect(getFormationsRequest).toHaveBeenCalledTimes(1);
    expect(useDraftStore.getState()).toMatchObject({
      error: null,
      formations: mockFormations,
      selectedFormationCode: mockFormation.code,
      status: "idle",
    });
  });

  it("does not create a session before a formation is selected", async () => {
    await useDraftStore.getState().createSession();

    expect(createDraftSessionRequest).not.toHaveBeenCalled();
    expect(useDraftStore.getState().error).toBe("Choose a formation first.");
  });

  it("creates a draft session with the selected formation", async () => {
    const sessionState = createMockDraftSessionState();

    jest.mocked(createDraftSessionRequest).mockResolvedValue(sessionState);
    useDraftStore.setState({ selectedFormationCode: "4-3-3" });

    await useDraftStore.getState().createSession();

    expect(createDraftSessionRequest).toHaveBeenCalledWith("access-token", "4-3-3");
    expect(useDraftStore.getState()).toMatchObject({
      error: null,
      selectedFormationCode: sessionState.session.formation,
      sessionState,
      status: "idle",
    });
  });

  it("loads options for the selected session slot", async () => {
    const initialSessionState = createMockDraftSessionState();
    const nextSessionState = createMockDraftSessionState({
      optionsSlotNo: 6,
    });

    jest.mocked(getSlotOptionsRequest).mockResolvedValue(nextSessionState);
    useDraftStore.setState({ sessionState: initialSessionState });

    await useDraftStore.getState().loadSlotOptions(6);

    expect(getSlotOptionsRequest).toHaveBeenCalledWith(
      "access-token",
      initialSessionState.session.id,
      6,
    );
    expect(useDraftStore.getState().sessionState).toEqual(nextSessionState);
  });

  it("does not call swap request for the same slot", async () => {
    useDraftStore.setState({ sessionState: createMockDraftSessionState() });

    await useDraftStore.getState().swapPicks(3, 3);

    expect(swapPicksRequest).not.toHaveBeenCalled();
  });

  it("swaps picks and stores returned session state", async () => {
    const initialSessionState = createMockDraftSessionState();
    const swappedSessionState = createMockDraftSessionState({
      picks: [...initialSessionState.picks].reverse(),
    });

    jest.mocked(swapPicksRequest).mockResolvedValue(swappedSessionState);
    useDraftStore.setState({ sessionState: initialSessionState });

    await useDraftStore.getState().swapPicks(3, 10);

    expect(swapPicksRequest).toHaveBeenCalledWith(
      "access-token",
      initialSessionState.session.id,
      3,
      10,
    );
    expect(useDraftStore.getState().sessionState).toEqual(swappedSessionState);
  });

  it("starts tournament and stores tournament id in the current session", async () => {
    jest.mocked(startTournamentRequest).mockResolvedValue(mockTournamentChampion);
    useDraftStore.setState({ sessionState: mockCompletedDraftSessionState });

    await expect(useDraftStore.getState().startTournament("normal")).resolves.toEqual(
      mockTournamentChampion,
    );

    expect(startTournamentRequest).toHaveBeenCalledWith(
      "access-token",
      mockCompletedDraftSessionState.session.id,
      "normal",
    );
    expect(useDraftStore.getState().tournament).toEqual(mockTournamentChampion);
    expect(useDraftStore.getState().sessionState?.session.tournamentId).toBe(
      mockTournamentChampion.tournament.id,
    );
  });

  it("loads tournament and links it to matching session", async () => {
    const sessionState = createMockDraftSessionState();

    jest.mocked(getTournamentRequest).mockResolvedValue(mockTournamentChampion);
    useDraftStore.setState({ sessionState });

    await useDraftStore.getState().loadTournament(sessionState.session.id);

    expect(getTournamentRequest).toHaveBeenCalledWith(
      "access-token",
      sessionState.session.id,
    );
    expect(useDraftStore.getState().tournament).toEqual(mockTournamentChampion);
    expect(useDraftStore.getState().sessionState?.session.tournamentId).toBe(
      mockTournamentChampion.tournament.id,
    );
  });

  it("resets current draft session and tournament", () => {
    useDraftStore.setState({
      error: "Draft failed",
      sessionState: createMockDraftSessionState(),
      tournament: mockTournamentChampion,
    });

    useDraftStore.getState().resetDraft();

    expect(useDraftStore.getState()).toMatchObject({
      error: null,
      sessionState: null,
      status: "idle",
      tournament: null,
    });
  });
});
