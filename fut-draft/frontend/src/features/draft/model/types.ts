import type { DraftPlayerCard } from "@/entities/player";

export type { DraftFormation } from "@/entities/formation";
export type { DraftPlayer, DraftPlayerCard } from "@/entities/player";

export type DraftStatus =
  | "idle"
  | "loading"
  | "loading-options"
  | "creating"
  | "picking"
  | "swapping"
  | "starting-tournament";

export type DraftSessionStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export type DraftOption = {
  optionIndex: number;
  playerCard: DraftPlayerCard;
};

export type DraftPick = {
  slotNo: number;
  pickedAt: string;
  playerCard: DraftPlayerCard;
};

export type DraftSession = {
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

export type DraftChemistryPlayer = {
  slotNo: number;
  name: string;
  basePosition: string;
  chemistry: number;
  reasons: string[];
};

export type DraftChemistry = {
  teamChemistry: number;
  maxTeamChemistry: number;
  averagePlayerChemistry: number;
  players: DraftChemistryPlayer[];
};

export type DraftSessionState = {
  session: DraftSession;
  optionsSlotNo: number | null;
  options: DraftOption[];
  picks: DraftPick[];
  chemistry: DraftChemistry;
};

export type DraftPickResponse = DraftSessionState & {
  completed: boolean;
};

export type TournamentStage = "QUARTERFINAL" | "SEMIFINAL" | "FINAL";
export type TournamentStatus = "IN_PROGRESS" | "ELIMINATED" | "CHAMPION";

export type MatchEventType = "GOAL" | "MISSED_PENALTY" | "RED_CARD";

export type MatchTimelineEvent = {
  minute: number;
  type: MatchEventType;
  team: "HOME" | "AWAY";
  playerName: string;
  description: string;
};

export type TeamMatchStats = {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  missedPenalties: number;
  expectedGoals: number;
};

export type MatchStats = {
  home: TeamMatchStats;
  away: TeamMatchStats;
};

export type TournamentMatch = {
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
  matches: TournamentMatch[];
  userJourney: {
    matchesPlayed: number;
    eliminatedIn: TournamentStage | null;
    isChampion: boolean;
  };
};
