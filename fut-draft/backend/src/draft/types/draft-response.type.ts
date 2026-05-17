import type {
  DraftSessionStatus,
  TournamentStage,
  TournamentStatus,
} from "@prisma/client";

import type {
  MatchStats,
  MatchTimelineEvent,
} from "../match-simulator.service";

export type DraftFormationResponse = {
  code: string;
  name: string;
  lineupSlots: string[];
  benchSlots: number;
  totalSlots: number;
  requiredGoalkeepers: number;
};

export type DraftPlayerResponse = {
  fullName: string;
  nation: string;
  club: string;
  league: string;
  imageUrl: string | null;
};

export type DraftPlayerCardResponse = {
  id: string;
  overall: number;
  basePosition: string;
  rarity: string;
  player: DraftPlayerResponse;
};

export type DraftOptionResponse = {
  optionIndex: number;
  playerCard: DraftPlayerCardResponse;
};

export type DraftPickResponseItem = {
  slotNo: number;
  pickedAt: string;
  playerCard: DraftPlayerCardResponse;
};

export type DraftSessionResponse = {
  id: string;
  userId: string;
  formation: string;
  status: DraftSessionStatus;
  currentSlot: number;
  totalSlots: number;
  goalkeepersRequired: number;
  startedAt: string;
  completedAt: string | null;
  pickedCount: number;
  remainingSlots: number;
  goalkeepersPicked: number;
  tournamentId: string | null;
};

export type DraftChemistryPlayerResponse = {
  slotNo: number;
  name: string;
  basePosition: string;
  chemistry: number;
  reasons: string[];
};

export type DraftChemistryResponse = {
  teamChemistry: number;
  maxTeamChemistry: number;
  averagePlayerChemistry: number;
  players: DraftChemistryPlayerResponse[];
};

export type DraftSessionStateResponse = {
  session: DraftSessionResponse;
  optionsSlotNo: number | null;
  options: DraftOptionResponse[];
  picks: DraftPickResponseItem[];
  chemistry: DraftChemistryResponse;
};

export type DraftCurrentOptionsResponse = {
  session: DraftSessionResponse;
  optionsSlotNo: number | null;
  options: DraftOptionResponse[];
};

export type DraftPickActionResponse = DraftSessionStateResponse & {
  completed: boolean;
};

export type DraftPicksResponse = {
  sessionId: string;
  picks: DraftPickResponseItem[];
  chemistry: DraftChemistryResponse;
  summary: {
    totalPicked: number;
    goalkeepersPicked: number;
  };
};

export type SavedSquadSnapshotResponse = {
  chemistry: DraftChemistryResponse;
  formation: string;
  picks: DraftPickResponseItem[];
  savedAt: string;
  sessionId: string;
};

export type SavedSquadResponse = {
  id: string;
  sessionId: string;
  name: string;
  formation: string;
  rating: number;
  chemistry: number;
  snapshot: SavedSquadSnapshotResponse;
  createdAt: string;
};

export type DeleteSavedSquadResponse = {
  deletedCount: number;
  success: boolean;
};

export type TournamentMatchResponse = {
  id: string;
  stage: TournamentStage;
  bracketIndex: number;
  homeTeamName: string;
  awayTeamName: string;
  homeStrength: number;
  awayStrength: number;
  homeChemistry: number;
  awayChemistry: number;
  homeScore: number;
  awayScore: number;
  winnerTeamName: string;
  isUserMatch: boolean;
  wentToPenalties: boolean;
  simulationProvider: string;
  simulationReason: string | null;
  playedAt: string;
  homeLineup: string[];
  awayLineup: string[];
  events: MatchTimelineEvent[];
  stats: MatchStats | null;
};

export type TournamentResponse = {
  tournament: {
    id: string;
    sessionId: string;
    status: TournamentStatus;
    userTeamName: string;
    championTeam: string | null;
    completedAt: string | null;
  };
  matches: TournamentMatchResponse[];
  userJourney: {
    matchesPlayed: number;
    eliminatedIn: TournamentStage | null;
    isChampion: boolean;
  };
};
