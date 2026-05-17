import type { SeedPlayer } from "./types";
import { clamp, deterministicHash, normalizeName } from "./utils";

const FALLBACK_POSITIONS = [
  "GK",
  "RB",
  "LB",
  "RWB",
  "LWB",
  "CB",
  "CDM",
  "CM",
  "CAM",
  "RM",
  "LM",
  "RW",
  "LW",
  "CF",
  "ST",
] as const;

const FALLBACK_FIRST_NAMES = [
  "Aron",
  "Mika",
  "Dario",
  "Levon",
  "Nico",
  "Tomas",
  "Elias",
  "Roman",
  "Pavel",
  "Marco",
  "Felix",
  "Ivan",
  "Milan",
  "Leon",
  "Hugo",
  "Karim",
  "Jonas",
  "Theo",
  "Oscar",
  "Stefan",
  "Luca",
  "Viktor",
  "Adrian",
  "Emil",
  "Ruben",
  "Mateo",
  "Noel",
  "Silas",
  "Timur",
  "Denis",
];

const FALLBACK_LAST_NAMES = [
  "Volkov",
  "Marin",
  "Costa",
  "Novak",
  "Keller",
  "Duarte",
  "Petrov",
  "Silva",
  "Moreau",
  "Varga",
  "Kovac",
  "Santos",
  "Bauer",
  "Rojas",
  "Meyer",
  "Laurent",
  "Fischer",
  "Moreno",
  "Ilic",
  "Sokol",
  "Hartmann",
  "Varela",
  "Nordin",
  "Bakker",
  "Pavlov",
  "Reyes",
  "Gruber",
  "Ferreira",
  "Larsen",
  "Orlov",
];

const FALLBACK_CLUBS = [
  "Northbridge United",
  "Orion Athletic",
  "Valley Rovers",
  "Metro City",
  "Atlas XI",
  "Royal Thunder",
  "Emerald Stars",
  "Skyline AFC",
];

const FALLBACK_NATIONS = [
  "England",
  "Spain",
  "Germany",
  "France",
  "Portugal",
  "Netherlands",
  "Croatia",
  "Brazil",
  "Argentina",
  "Serbia",
  "Denmark",
  "Poland",
];

export const FALLBACK_PLAYERS: SeedPlayer[] = createFallbackPlayers();

function createFallbackPlayers(): SeedPlayer[] {
  const usedNames = new Set<string>();
  const players: SeedPlayer[] = [];
  const fallbackPlayersPerPosition = 7;

  for (const [positionIndex, position] of FALLBACK_POSITIONS.entries()) {
    for (let index = 0; index < fallbackPlayersPerPosition; index += 1) {
      const firstName =
        FALLBACK_FIRST_NAMES[
          (positionIndex * 5 + index) % FALLBACK_FIRST_NAMES.length
        ];
      let lastNameIndex = positionIndex * 7 + index * 3;
      let lastName =
        FALLBACK_LAST_NAMES[lastNameIndex % FALLBACK_LAST_NAMES.length];
      let fullName = `${firstName} ${lastName}`;

      while (usedNames.has(normalizeName(fullName))) {
        lastNameIndex += 1;
        lastName =
          FALLBACK_LAST_NAMES[lastNameIndex % FALLBACK_LAST_NAMES.length];
        fullName = `${firstName} ${lastName}`;
      }

      usedNames.add(normalizeName(fullName));

      const overallSeed = deterministicHash(`${fullName}${position}`);
      const positionBoost = position === "GK" || position === "ST" ? 2 : 0;

      players.push({
        club: FALLBACK_CLUBS[(positionIndex + index) % FALLBACK_CLUBS.length],
        fullName,
        imageSource: null,
        imageUrl: null,
        league: "Fallback League",
        nation:
          FALLBACK_NATIONS[
            (positionIndex * 2 + index) % FALLBACK_NATIONS.length
          ],
        overall: clamp(70 + (overallSeed % 11) + positionBoost, 70, 84),
        primaryPosition: position,
      });
    }
  }

  return players;
}
