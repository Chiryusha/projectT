import type { DraftFormation } from "@/entities/formation";
import type { DraftPlayerCard } from "@/entities/player";
import type { SavedSquad } from "@/entities/saved-squad";

export const mockStrikerCard: DraftPlayerCard = {
  basePosition: "ST",
  id: "card-alex-volkov",
  overall: 91,
  player: {
    club: "FUT Academy",
    fullName: "Alex Volkov",
    imageUrl: null,
    league: "Elite League",
    nation: "Brazil",
  },
  rarity: "gold",
};

export const mockGoalkeeperCard: DraftPlayerCard = {
  basePosition: "GK",
  id: "card-mateo-keeper",
  overall: 89,
  player: {
    club: "FUT Academy",
    fullName: "Mateo Keeper",
    imageUrl: null,
    league: "Elite League",
    nation: "Brazil",
  },
  rarity: "gold",
};

export const mockDefenderCard: DraftPlayerCard = {
  basePosition: "CB",
  id: "card-ivan-stone",
  overall: 85,
  player: {
    club: "Northbridge United",
    fullName: "Ivan Stone",
    imageUrl: null,
    league: "Premier League",
    nation: "Serbia",
  },
  rarity: "gold",
};

export const mockMidfielderCard: DraftPlayerCard = {
  basePosition: "CM",
  id: "card-daniel-santos",
  overall: 87,
  player: {
    club: "Northbridge United",
    fullName: "Daniel Santos",
    imageUrl: null,
    league: "Premier League",
    nation: "Portugal",
  },
  rarity: "gold",
};

export const mockWingerCard: DraftPlayerCard = {
  basePosition: "LW",
  id: "card-lucas-rivera",
  overall: 90,
  player: {
    club: "FUT Academy",
    fullName: "Lucas Rivera",
    imageUrl: null,
    league: "Elite League",
    nation: "Argentina",
  },
  rarity: "gold",
};

export const mockBenchCard: DraftPlayerCard = {
  basePosition: "CM",
  id: "card-maxim-orlov",
  overall: 82,
  player: {
    club: "Orion Athletic",
    fullName: "Maxim Orlov",
    imageUrl: null,
    league: "Continental League",
    nation: "Russia",
  },
  rarity: "gold",
};

export const mockDraftCards = [
  mockGoalkeeperCard,
  mockDefenderCard,
  mockMidfielderCard,
  mockWingerCard,
  mockStrikerCard,
  mockBenchCard,
];

export const mockFormation: DraftFormation = {
  benchSlots: 7,
  code: "4-3-3",
  lineupSlots: ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"],
  name: "4-3-3 Attack",
  requiredGoalkeepers: 2,
  totalSlots: 18,
};

export const mockFourFourTwoFormation: DraftFormation = {
  benchSlots: 7,
  code: "4-4-2",
  lineupSlots: ["GK", "RB", "CB", "CB", "LB", "RM", "CM", "CM", "LM", "ST", "ST"],
  name: "4-4-2 Classic",
  requiredGoalkeepers: 2,
  totalSlots: 18,
};

export const mockFiveThreeTwoFormation: DraftFormation = {
  benchSlots: 7,
  code: "5-3-2",
  lineupSlots: ["GK", "RWB", "CB", "CB", "CB", "LWB", "CM", "CM", "CM", "ST", "ST"],
  name: "5-3-2 Compact",
  requiredGoalkeepers: 2,
  totalSlots: 18,
};

export const mockFormations = [
  mockFormation,
  mockFourFourTwoFormation,
  mockFiveThreeTwoFormation,
];

export const mockSavedSquad: SavedSquad = {
  chemistry: 86,
  createdAt: "2026-05-15T11:00:00.000Z",
  formation: "4-3-3",
  id: "saved-squad-id",
  name: "Weekend Draft 15.05.2026",
  rating: 88,
  sessionId: "session-id",
  snapshot: {
    chemistry: {
      averagePlayerChemistry: 4.7,
      maxTeamChemistry: 100,
      players: [],
      teamChemistry: 86,
    },
    formation: "4-3-3",
    picks: [
      {
        pickedAt: "2026-05-15T11:00:00.000Z",
        playerCard: mockGoalkeeperCard,
        slotNo: 1,
      },
      {
        pickedAt: "2026-05-15T11:00:00.000Z",
        playerCard: mockStrikerCard,
        slotNo: 10,
      },
      {
        pickedAt: "2026-05-15T11:00:00.000Z",
        playerCard: mockMidfielderCard,
        slotNo: 6,
      },
    ],
    savedAt: "2026-05-15T11:00:00.000Z",
    sessionId: "session-id",
  },
};
