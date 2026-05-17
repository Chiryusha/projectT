export type SeedPlayer = {
  club: string;
  fullName: string;
  imageSource?: string | null;
  imageUrl?: string | null;
  league: string;
  nation: string;
  overall: number;
  primaryPosition: string;
};

export type StatsTemplate = {
  defending: number;
  dribbling: number;
  pace: number;
  passing: number;
  physical: number;
  shooting: number;
};

export type SportsDbTeam = {
  idTeam?: string | null;
  intLoved?: string | null;
  strLeague?: string | null;
  strTeam?: string | null;
};

export type SportsDbPlayer = {
  idPlayer?: string | null;
  intLoved?: string | null;
  strCutout?: string | null;
  strNationality?: string | null;
  strPlayer?: string | null;
  strPosition?: string | null;
  strRender?: string | null;
  strSport?: string | null;
  strStatus?: string | null;
  strTeam?: string | null;
  strThumb?: string | null;
};

export type SportsDbTeamsResponse = {
  teams?: SportsDbTeam[] | null;
};

export type SportsDbPlayersResponse = {
  player?: SportsDbPlayer[] | null;
};
