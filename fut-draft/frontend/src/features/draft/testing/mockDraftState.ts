import type {
  DraftPick,
  DraftSessionState,
  TournamentResponse,
} from "../model/types";
import {
  mockBenchCard,
  mockDefenderCard,
  mockDraftCards,
  mockGoalkeeperCard,
  mockMidfielderCard,
  mockStrikerCard,
  mockWingerCard,
} from "@/shared/testing/mockDraftData";

const pickedAt = "2026-05-15T11:00:00.000Z";

export const mockDraftPicks: DraftPick[] = [
  { pickedAt, playerCard: mockGoalkeeperCard, slotNo: 1 },
  { pickedAt, playerCard: mockDefenderCard, slotNo: 3 },
  { pickedAt, playerCard: mockMidfielderCard, slotNo: 6 },
  { pickedAt, playerCard: mockWingerCard, slotNo: 11 },
  { pickedAt, playerCard: mockStrikerCard, slotNo: 10 },
  { pickedAt, playerCard: mockBenchCard, slotNo: 12 },
];

export const createMockDraftSessionState = (
  overrides: Partial<DraftSessionState> = {},
): DraftSessionState => {
  const picks = overrides.picks ?? mockDraftPicks;

  return {
    chemistry: {
      averagePlayerChemistry: 3.9,
      maxTeamChemistry: 100,
      players: picks.map((pick) => ({
        basePosition: pick.playerCard.basePosition,
        chemistry: pick.slotNo <= 11 ? 4 : 0,
        name: pick.playerCard.player.fullName,
        reasons: ["position-fit", "club-link"],
        slotNo: pick.slotNo,
      })),
      teamChemistry: 78,
    },
    options: mockDraftCards.slice(1, 6).map((playerCard, index) => ({
      optionIndex: index + 1,
      playerCard,
    })),
    optionsSlotNo: 10,
    picks,
    session: {
      completedAt: null,
      currentSlot: 10,
      formation: "4-3-3",
      goalkeepersPicked: 1,
      goalkeepersRequired: 2,
      id: "session-id",
      pickedCount: picks.length,
      remainingSlots: 18 - picks.length,
      startedAt: "2026-05-15T10:30:00.000Z",
      status: "IN_PROGRESS",
      totalSlots: 18,
      tournamentId: null,
      userId: "user-id",
    },
    ...overrides,
  };
};

export const mockCompletedDraftSessionState = createMockDraftSessionState({
  options: [],
  optionsSlotNo: null,
  session: {
    completedAt: "2026-05-15T11:12:00.000Z",
    currentSlot: 18,
    formation: "4-3-3",
    goalkeepersPicked: 2,
    goalkeepersRequired: 2,
    id: "session-id",
    pickedCount: 18,
    remainingSlots: 0,
    startedAt: "2026-05-15T10:30:00.000Z",
    status: "COMPLETED",
    totalSlots: 18,
    tournamentId: "tournament-id",
    userId: "user-id",
  },
});

export const mockTournamentChampion: TournamentResponse = {
  matches: [
    {
      awayChemistry: 74,
      awayLineup: ["GK Costa", "ST Silva"],
      awayScore: 1,
      awayStrength: 82,
      awayTeamName: "Blue Armada",
      bracketIndex: 1,
      events: [],
      homeChemistry: 86,
      homeLineup: ["GK Mateo Keeper", "ST Alex Volkov"],
      homeScore: 3,
      homeStrength: 89,
      homeTeamName: "User Squad",
      id: "match-qf",
      isUserMatch: true,
      playedAt: "2026-05-15T12:00:00.000Z",
      simulationProvider: "local",
      simulationReason: "Strong attacking performance",
      stage: "QUARTERFINAL",
      stats: null,
      wentToPenalties: false,
      winnerTeamName: "User Squad",
    },
    {
      awayChemistry: 78,
      awayLineup: ["GK Rossi", "ST Kane"],
      awayScore: 2,
      awayStrength: 86,
      awayTeamName: "User Squad",
      bracketIndex: 1,
      events: [],
      homeChemistry: 80,
      homeLineup: ["GK Muller", "ST Hughes"],
      homeScore: 1,
      homeStrength: 84,
      homeTeamName: "Orion Athletic",
      id: "match-sf",
      isUserMatch: true,
      playedAt: "2026-05-15T12:05:00.000Z",
      simulationProvider: "local",
      simulationReason: "Late winner",
      stage: "SEMIFINAL",
      stats: null,
      wentToPenalties: false,
      winnerTeamName: "User Squad",
    },
    {
      awayChemistry: 90,
      awayLineup: ["GK Royal", "ST Thunder"],
      awayScore: 2,
      awayStrength: 90,
      awayTeamName: "Royal Thunder",
      bracketIndex: 1,
      events: [],
      homeChemistry: 86,
      homeLineup: ["GK Mateo Keeper", "ST Alex Volkov"],
      homeScore: 4,
      homeStrength: 91,
      homeTeamName: "User Squad",
      id: "match-final",
      isUserMatch: true,
      playedAt: "2026-05-15T12:10:00.000Z",
      simulationProvider: "local",
      simulationReason: "Final won by pressing",
      stage: "FINAL",
      stats: null,
      wentToPenalties: false,
      winnerTeamName: "User Squad",
    },
  ],
  tournament: {
    championTeam: "User Squad",
    completedAt: "2026-05-15T12:15:00.000Z",
    id: "tournament-id",
    sessionId: "session-id",
    status: "CHAMPION",
    userTeamName: "User Squad",
  },
  userJourney: {
    eliminatedIn: null,
    isChampion: true,
    matchesPlayed: 3,
  },
};

export const mockTournamentEliminated: TournamentResponse = {
  ...mockTournamentChampion,
  matches: [
    {
      ...mockTournamentChampion.matches[0],
      awayScore: 2,
      homeScore: 1,
      winnerTeamName: "Blue Armada",
    },
  ],
  tournament: {
    ...mockTournamentChampion.tournament,
    championTeam: "Blue Armada",
    status: "ELIMINATED",
  },
  userJourney: {
    eliminatedIn: "QUARTERFINAL",
    isChampion: false,
    matchesPlayed: 1,
  },
};
