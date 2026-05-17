import {
  DEFAULT_API_KEY,
  DEFAULT_PLAYERS_PER_TEAM,
  DEFAULT_TEAMS_PER_LEAGUE,
  LEAGUES_TO_IMPORT,
  POSITION_ALIASES,
  PREFERRED_TEAM_ALIASES,
  REQUEST_DELAY_MS,
  TEAM_RATING_BASE,
  THE_SPORTS_DB_BASE_URL,
} from "./config";
import type {
  SeedPlayer,
  SportsDbPlayer,
  SportsDbPlayersResponse,
  SportsDbTeam,
  SportsDbTeamsResponse,
} from "./types";
import {
  clamp,
  deterministicHash,
  normalizeName,
  readPositiveInt,
  sleep,
  toQueryValue,
} from "./utils";

export async function fetchSportsDbSeedPlayers(): Promise<SeedPlayer[]> {
  const teamsPerLeague = readPositiveInt(
    process.env.THESPORTSDB_TEAMS_PER_LEAGUE,
    DEFAULT_TEAMS_PER_LEAGUE,
  );
  const playersPerTeam = readPositiveInt(
    process.env.THESPORTSDB_PLAYERS_PER_TEAM,
    DEFAULT_PLAYERS_PER_TEAM,
  );
  const players: SeedPlayer[] = [];

  for (const league of LEAGUES_TO_IMPORT) {
    const teams = await fetchTeamsForLeague(league.name);
    await sleep(REQUEST_DELAY_MS);

    const selectedTeams = pickPreferredTeams(
      teams,
      league.preferredTeams,
      teamsPerLeague,
    );

    console.log(
      `TheSportsDB ${league.name}: ${selectedTeams.map((team) => team.strTeam).join(", ")}`,
    );

    for (const team of selectedTeams) {
      const teamPlayers = await fetchPlayersForTeam(team, league.name);

      players.push(...teamPlayers.slice(0, playersPerTeam));
      await sleep(REQUEST_DELAY_MS);
    }
  }

  return players;
}

export function dedupePlayers(players: SeedPlayer[]): SeedPlayer[] {
  const dedupedPlayers = new Map<string, SeedPlayer>();

  for (const player of players) {
    const key = normalizeName(player.fullName);
    const existingPlayer = dedupedPlayers.get(key);

    if (!existingPlayer || player.imageUrl) {
      dedupedPlayers.set(key, player);
    }
  }

  return Array.from(dedupedPlayers.values());
}

async function fetchJson<T>(endpoint: string): Promise<T | null> {
  const response = await fetch(buildSportsDbUrl(endpoint), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (FUT Draft seed)",
    },
  });

  if (!response.ok) {
    console.warn(
      `TheSportsDB request failed: ${endpoint} -> ${response.status}`,
    );
    if (response.status === 403) {
      console.warn(
        "TheSportsDB returned 403. Check THESPORTSDB_API_KEY, rate limits, or try again later.",
      );
    }

    return null;
  }

  return (await response.json()) as T;
}

function buildSportsDbUrl(endpoint: string): string {
  const apiKey = process.env.THESPORTSDB_API_KEY ?? DEFAULT_API_KEY;

  return `${THE_SPORTS_DB_BASE_URL}/${apiKey}/${endpoint}`;
}

function resolvePosition(
  rawPosition: string | null | undefined,
): string | null {
  const normalizedPosition = (rawPosition ?? "")
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedPosition) {
    return null;
  }

  const match = POSITION_ALIASES.find(([aliases]) =>
    aliases.some((alias) => normalizedPosition.includes(alias)),
  );

  return match?.[1] ?? null;
}

function resolveTeamBaseRating(teamName: string, leagueName: string): number {
  const normalizedTeamName = normalizeName(teamName);
  const explicitRating =
    TEAM_RATING_BASE[teamName.toLowerCase()] ??
    TEAM_RATING_BASE[normalizedTeamName];

  if (explicitRating) {
    return explicitRating;
  }

  if (/premier|liga|bundesliga|serie|ligue/i.test(leagueName)) {
    return 78;
  }

  return 74;
}

function resolveOverall(
  player: SportsDbPlayer,
  position: string,
  leagueName: string,
): number {
  const lovedBoost = clamp(Number(player.intLoved ?? 0), 0, 8);
  const teamBase = resolveTeamBaseRating(
    player.strTeam ?? "Unknown",
    leagueName,
  );
  const positionBoost = position === "GK" || position === "ST" ? 1 : 0;
  const variance =
    deterministicHash(`${player.idPlayer ?? ""}${player.strPlayer ?? ""}`) % 7;

  return clamp(teamBase + positionBoost + lovedBoost + variance - 3, 68, 92);
}

function isActiveSoccerPlayer(player: SportsDbPlayer): boolean {
  if (player.strSport !== "Soccer") {
    return false;
  }

  if (player.strStatus && player.strStatus !== "Active") {
    return false;
  }

  return Boolean(player.strPlayer && resolvePosition(player.strPosition));
}

function mapSportsDbPlayer(
  player: SportsDbPlayer,
  fallbackLeague: string,
): SeedPlayer | null {
  const primaryPosition = resolvePosition(player.strPosition);

  if (!primaryPosition || !player.strPlayer) {
    return null;
  }

  const club = player.strTeam?.trim() || "Free Agent";
  const league = fallbackLeague;
  const imageUrl =
    player.strCutout ?? player.strRender ?? player.strThumb ?? null;

  return {
    club,
    fullName: player.strPlayer,
    imageSource: imageUrl ? "TheSportsDB" : null,
    imageUrl,
    league,
    nation: player.strNationality ?? "Unknown",
    overall: resolveOverall(player, primaryPosition, league),
    primaryPosition,
  };
}

function pickPreferredTeams(
  teams: SportsDbTeam[],
  preferredTeams: string[],
  limit: number,
): SportsDbTeam[] {
  const selectedTeams: SportsDbTeam[] = [];
  const usedTeamIds = new Set<string>();

  for (const preferredTeam of preferredTeams) {
    const team = teams.find((candidate) => {
      return (
        candidate.idTeam &&
        candidate.strTeam &&
        isPreferredTeamMatch(candidate.strTeam, preferredTeam)
      );
    });

    if (team?.idTeam && !usedTeamIds.has(team.idTeam)) {
      selectedTeams.push(team);
      usedTeamIds.add(team.idTeam);
    }
  }

  for (const team of teams) {
    if (selectedTeams.length >= limit) {
      break;
    }

    if (team.idTeam && !usedTeamIds.has(team.idTeam)) {
      selectedTeams.push(team);
      usedTeamIds.add(team.idTeam);
    }
  }

  return selectedTeams.slice(0, limit);
}

function isPreferredTeamMatch(
  candidateTeamName: string,
  preferredTeamName: string,
): boolean {
  const normalizedCandidateTeamName = normalizeName(candidateTeamName);
  const normalizedPreferredTeamName = normalizeName(preferredTeamName);
  const aliases = [
    normalizedPreferredTeamName,
    ...(PREFERRED_TEAM_ALIASES[normalizedPreferredTeamName] ?? []),
  ];

  return aliases.some((alias) => {
    if (normalizedCandidateTeamName === alias) {
      return true;
    }

    return (
      normalizedCandidateTeamName.length <= alias.length &&
      alias.includes(normalizedCandidateTeamName)
    );
  });
}

async function fetchTeamsForLeague(
  leagueName: string,
): Promise<SportsDbTeam[]> {
  const data = await fetchJson<SportsDbTeamsResponse>(
    `search_all_teams.php?l=${toQueryValue(leagueName)}`,
  );

  return data?.teams?.filter((team) => team.idTeam && team.strTeam) ?? [];
}

async function fetchPlayersForTeam(
  team: SportsDbTeam,
  leagueName: string,
): Promise<SeedPlayer[]> {
  if (!team.idTeam) {
    return [];
  }

  const data = await fetchJson<SportsDbPlayersResponse>(
    `lookup_all_players.php?id=${team.idTeam}`,
  );
  const sportsDbPlayers = data?.player ?? [];

  return sportsDbPlayers
    .filter(isActiveSoccerPlayer)
    .map((player) => mapSportsDbPlayer(player, leagueName))
    .filter((player): player is SeedPlayer => Boolean(player));
}
