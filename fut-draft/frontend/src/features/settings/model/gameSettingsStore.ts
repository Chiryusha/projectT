import { create } from "zustand";

import {
  AI_DIFFICULTIES,
  MATCH_SPEEDS,
  type AiDifficulty,
  type MatchSpeed,
} from "@/shared/config/gameSettings";

const GAME_SETTINGS_STORAGE_KEY = "gameSettings";

type GameSettings = {
  aiDifficulty: AiDifficulty;
  matchSpeed: MatchSpeed;
};

type GameSettingsStore = GameSettings & {
  resetSettings: () => void;
  setAiDifficulty: (aiDifficulty: AiDifficulty) => void;
  setMatchSpeed: (matchSpeed: MatchSpeed) => void;
};

const defaultSettings: GameSettings = {
  aiDifficulty: "normal",
  matchSpeed: "normal",
};

const canUseStorage = () =>
  typeof window !== "undefined" && Boolean(window.localStorage);

const isAiDifficulty = (value: unknown): value is AiDifficulty => {
  return (
    typeof value === "string" &&
    AI_DIFFICULTIES.includes(value as AiDifficulty)
  );
};

const isMatchSpeed = (value: unknown): value is MatchSpeed => {
  return typeof value === "string" && MATCH_SPEEDS.includes(value as MatchSpeed);
};

const readStoredSettings = (): GameSettings => {
  if (!canUseStorage()) {
    return defaultSettings;
  }

  const rawSettings = localStorage.getItem(GAME_SETTINGS_STORAGE_KEY);

  if (!rawSettings) {
    return defaultSettings;
  }

  try {
    const parsedSettings = JSON.parse(rawSettings) as Partial<GameSettings>;

    return {
      aiDifficulty: isAiDifficulty(parsedSettings.aiDifficulty)
        ? parsedSettings.aiDifficulty
        : defaultSettings.aiDifficulty,
      matchSpeed: isMatchSpeed(parsedSettings.matchSpeed)
        ? parsedSettings.matchSpeed
        : defaultSettings.matchSpeed,
    };
  } catch {
    localStorage.removeItem(GAME_SETTINGS_STORAGE_KEY);

    return defaultSettings;
  }
};

const persistSettings = (settings: GameSettings) => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(GAME_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const useGameSettingsStore = create<GameSettingsStore>((set, get) => ({
  ...readStoredSettings(),

  resetSettings: () => {
    persistSettings(defaultSettings);
    set(defaultSettings);
  },

  setAiDifficulty: (aiDifficulty) => {
    const nextSettings = {
      aiDifficulty,
      matchSpeed: get().matchSpeed,
    };

    persistSettings(nextSettings);
    set(nextSettings);
  },

  setMatchSpeed: (matchSpeed) => {
    const nextSettings = {
      aiDifficulty: get().aiDifficulty,
      matchSpeed,
    };

    persistSettings(nextSettings);
    set(nextSettings);
  },
}));
