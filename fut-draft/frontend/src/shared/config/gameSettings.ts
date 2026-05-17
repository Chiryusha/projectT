export const AI_DIFFICULTIES = ["easy", "normal", "hard"] as const;
export const MATCH_SPEEDS = ["fast", "normal", "slow"] as const;

export type AiDifficulty = (typeof AI_DIFFICULTIES)[number];
export type MatchSpeed = (typeof MATCH_SPEEDS)[number];

export const MATCH_SPEED_DURATIONS: Record<MatchSpeed, number> = {
  fast: 30_000,
  normal: 50_000,
  slow: 70_000,
};
