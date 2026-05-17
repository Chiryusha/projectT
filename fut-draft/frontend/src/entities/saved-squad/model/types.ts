import type { DraftPlayerCard } from "@/entities/player";

export type SavedSquadPick = {
  pickedAt: string;
  playerCard: DraftPlayerCard;
  slotNo: number;
};

export type SavedSquadChemistryPlayer = {
  basePosition: string;
  chemistry: number;
  name: string;
  reasons: string[];
  slotNo: number;
};

export type SavedSquadChemistry = {
  averagePlayerChemistry: number;
  maxTeamChemistry: number;
  players: SavedSquadChemistryPlayer[];
  teamChemistry: number;
};

export type SavedSquadSnapshot = {
  chemistry: SavedSquadChemistry;
  formation: string;
  picks: SavedSquadPick[];
  savedAt: string;
  sessionId: string;
};

export type SavedSquad = {
  chemistry: number;
  createdAt: string;
  formation: string;
  id: string;
  name: string;
  rating: number;
  sessionId: string;
  snapshot: SavedSquadSnapshot;
};
