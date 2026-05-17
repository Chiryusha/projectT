import { join } from "path";

import { readPositiveInt } from "./utils";

export const THE_SPORTS_DB_BASE_URL = "https://www.thesportsdb.com/api/v1/json";
export const DEFAULT_API_KEY = "123";
export const DEFAULT_TEAMS_PER_LEAGUE = 6;
export const DEFAULT_PLAYERS_PER_TEAM = 26;

export const REQUEST_DELAY_MS = readPositiveInt(
  process.env.THESPORTSDB_REQUEST_DELAY_MS,
  2_150,
);
export const IMAGE_REQUEST_DELAY_MS = readPositiveInt(
  process.env.THESPORTSDB_IMAGE_REQUEST_DELAY_MS,
  120,
);
export const IMAGE_FETCH_TIMEOUT_MS = readPositiveInt(
  process.env.THESPORTSDB_IMAGE_FETCH_TIMEOUT_MS,
  15_000,
);

export const PLAYER_IMAGE_PUBLIC_PATH = "/player-images";
export const PLAYER_IMAGE_CACHE_DIR =
  process.env.PLAYER_IMAGE_CACHE_DIR ??
  join(process.cwd(), "public", "player-images");
export const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export const LEAGUES_TO_IMPORT = [
  {
    name: "English Premier League",
    preferredTeams: [
      "Manchester City",
      "Liverpool",
      "Arsenal",
      "Chelsea",
      "Manchester United",
      "Tottenham Hotspur",
      "Newcastle United",
      "Aston Villa",
    ],
  },
  {
    name: "Spanish La Liga",
    preferredTeams: [
      "Real Madrid",
      "Barcelona",
      "Atletico Madrid",
      "Villarreal",
      "Real Betis",
      "Athletic Bilbao",
    ],
  },
  {
    name: "Italian Serie A",
    preferredTeams: [
      "Inter Milan",
      "AC Milan",
      "Juventus",
      "Napoli",
      "Atalanta",
      "Roma",
    ],
  },
  {
    name: "German Bundesliga",
    preferredTeams: [
      "Bayern Munich",
      "Bayer Leverkusen",
      "Borussia Dortmund",
      "RB Leipzig",
      "Eintracht Frankfurt",
      "Stuttgart",
    ],
  },
  {
    name: "French Ligue 1",
    preferredTeams: [
      "Paris SG",
      "Monaco",
      "Marseille",
      "Lyon",
      "Lille",
      "Nice",
    ],
  },
];

export const PREFERRED_TEAM_ALIASES: Record<string, string[]> = {
  acmilan: ["milan"],
  athleticbilbao: ["athleticclub"],
  atleticomadrid: ["atleticodemadrid"],
  bayernmunich: ["bayernmunchen"],
  intermilan: ["internazionale", "inter"],
  manchestercity: ["mancity"],
  manchesterunited: ["manutd", "manunited"],
  parissg: ["parissaintgermain", "parissaintgermainfc", "psg"],
  rbleipzig: ["redbullleipzig"],
  realmadrid: ["realmadridcf"],
  tottenhamhotspur: ["tottenham"],
};

export const POSITION_ALIASES: Array<[string[], string]> = [
  [["goalkeeper", "keeper"], "GK"],
  [["right wing back", "right-wing-back"], "RWB"],
  [["left wing back", "left-wing-back"], "LWB"],
  [["right back", "right-back"], "RB"],
  [["left back", "left-back"], "LB"],
  [
    ["centre back", "center back", "centre-back", "center-back", "defender"],
    "CB",
  ],
  [["defensive midfield", "defensive midfielder"], "CDM"],
  [["attacking midfield", "attacking midfielder"], "CAM"],
  [
    ["central midfield", "centre midfield", "central midfielder", "midfielder"],
    "CM",
  ],
  [["right midfield", "right midfielder"], "RM"],
  [["left midfield", "left midfielder"], "LM"],
  [["right winger", "right wing"], "RW"],
  [["left winger", "left wing"], "LW"],
  [
    ["centre forward", "center forward", "centre-forward", "center-forward"],
    "CF",
  ],
  [["striker", "forward"], "ST"],
];

export const TEAM_RATING_BASE: Record<string, number> = {
  arsenal: 84,
  astonvilla: 80,
  atleticomadrid: 83,
  barcelona: 85,
  bayerleverkusen: 83,
  bayernmunich: 86,
  borussiadortmund: 82,
  chelsea: 82,
  intermilan: 84,
  juventus: 83,
  liverpool: 85,
  manchestercity: 87,
  manchesterunited: 82,
  napoli: 82,
  parissg: 86,
  realmadrid: 87,
  tottenhamhotspur: 82,
};
