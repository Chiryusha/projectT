import type { SeedPlayer, StatsTemplate } from "./types";
import { clamp } from "./utils";

const statsProfiles: Record<string, StatsTemplate> = {
  CAM: {
    defending: 60,
    dribbling: 87,
    pace: 76,
    passing: 86,
    physical: 70,
    shooting: 80,
  },
  CB: {
    defending: 86,
    dribbling: 63,
    pace: 68,
    passing: 66,
    physical: 85,
    shooting: 45,
  },
  CDM: {
    defending: 83,
    dribbling: 78,
    pace: 72,
    passing: 81,
    physical: 82,
    shooting: 68,
  },
  CF: {
    defending: 45,
    dribbling: 85,
    pace: 80,
    passing: 80,
    physical: 74,
    shooting: 84,
  },
  CM: {
    defending: 75,
    dribbling: 83,
    pace: 74,
    passing: 84,
    physical: 77,
    shooting: 74,
  },
  GK: {
    defending: 32,
    dribbling: 30,
    pace: 45,
    passing: 74,
    physical: 76,
    shooting: 18,
  },
  LB: {
    defending: 79,
    dribbling: 78,
    pace: 84,
    passing: 77,
    physical: 77,
    shooting: 60,
  },
  LM: {
    defending: 61,
    dribbling: 84,
    pace: 84,
    passing: 79,
    physical: 72,
    shooting: 76,
  },
  LW: {
    defending: 48,
    dribbling: 88,
    pace: 88,
    passing: 79,
    physical: 70,
    shooting: 82,
  },
  LWB: {
    defending: 76,
    dribbling: 79,
    pace: 85,
    passing: 77,
    physical: 74,
    shooting: 61,
  },
  RB: {
    defending: 80,
    dribbling: 77,
    pace: 84,
    passing: 76,
    physical: 77,
    shooting: 58,
  },
  RM: {
    defending: 62,
    dribbling: 83,
    pace: 84,
    passing: 79,
    physical: 71,
    shooting: 75,
  },
  RW: {
    defending: 50,
    dribbling: 88,
    pace: 88,
    passing: 80,
    physical: 70,
    shooting: 82,
  },
  RWB: {
    defending: 76,
    dribbling: 78,
    pace: 86,
    passing: 76,
    physical: 75,
    shooting: 62,
  },
  ST: {
    defending: 42,
    dribbling: 83,
    pace: 84,
    passing: 72,
    physical: 80,
    shooting: 88,
  },
};

export function buildStats(player: SeedPlayer, index: number) {
  const profile = statsProfiles[player.primaryPosition] ?? statsProfiles.CM;
  const coefficient = player.overall / 84;
  const variance = (seed: number) => ((index * 17 + seed * 13) % 7) - 3;

  return {
    defending: clamp(
      Math.round(profile.defending * coefficient + variance(5)),
      20,
      99,
    ),
    dribbling: clamp(
      Math.round(profile.dribbling * coefficient + variance(4)),
      20,
      99,
    ),
    pace: clamp(Math.round(profile.pace * coefficient + variance(1)), 25, 99),
    passing: clamp(
      Math.round(profile.passing * coefficient + variance(3)),
      20,
      99,
    ),
    physical: clamp(
      Math.round(profile.physical * coefficient + variance(6)),
      20,
      99,
    ),
    shooting: clamp(
      Math.round(profile.shooting * coefficient + variance(2)),
      15,
      99,
    ),
  };
}
