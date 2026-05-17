import type { DraftFormation, DraftPick } from "../model/types";

const MAX_PLAYER_CHEMISTRY = 5;
const MAX_TEAM_CHEMISTRY = 11 * MAX_PLAYER_CHEMISTRY;

export const calculateDraftChemistryPreview = (
  picks: DraftPick[],
  formation: DraftFormation,
) => {
  const starters = picks.filter((pick) => pick.slotNo <= 11);

  if (starters.length === 0) {
    return {
      teamChemistry: 0,
      players: new Map<number, number>(),
    };
  }

  const clubCounts = new Map<string, number>();
  const leagueCounts = new Map<string, number>();
  const nationCounts = new Map<string, number>();

  for (const pick of starters) {
    const { club, league, nation } = pick.playerCard.player;

    clubCounts.set(club, (clubCounts.get(club) ?? 0) + 1);
    leagueCounts.set(league, (leagueCounts.get(league) ?? 0) + 1);
    nationCounts.set(nation, (nationCounts.get(nation) ?? 0) + 1);
  }

  const players = new Map<number, number>();

  for (const pick of starters) {
    const requiredPosition = formation.lineupSlots[pick.slotNo - 1] ?? "ANY";
    const actualPosition = pick.playerCard.basePosition;
    let chemistry = 0;

    if (requiredPosition === actualPosition) {
      chemistry += 1;
    }

    if ((clubCounts.get(pick.playerCard.player.club) ?? 1) >= 2) {
      chemistry += 2;
    }

    if ((leagueCounts.get(pick.playerCard.player.league) ?? 1) >= 2) {
      chemistry += 1;
    }

    if ((nationCounts.get(pick.playerCard.player.nation) ?? 1) >= 2) {
      chemistry += 1;
    }

    players.set(pick.slotNo, Math.min(chemistry, MAX_PLAYER_CHEMISTRY));
  }

  const rawTeamChemistry = Array.from(players.values()).reduce(
    (sum, chemistry) => sum + chemistry,
    0,
  );

  return {
    teamChemistry: Math.round((rawTeamChemistry / MAX_TEAM_CHEMISTRY) * 100),
    players,
  };
};
