export const FORMATIONS = [
  {
    code: "4-3-3",
    name: "4-3-3 Attack",
    lineupSlots: ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"],
  },
  {
    code: "4-4-2",
    name: "4-4-2 Classic",
    lineupSlots: ["GK", "RB", "CB", "CB", "LB", "RM", "CM", "CM", "LM", "ST", "ST"],
  },
  {
    code: "3-5-2",
    name: "3-5-2 Control",
    lineupSlots: ["GK", "CB", "CB", "CB", "RM", "CM", "CM", "CAM", "LM", "ST", "ST"],
  },
  {
    code: "4-2-3-1",
    name: "4-2-3-1 Wide",
    lineupSlots: ["GK", "RB", "CB", "CB", "LB", "CDM", "CDM", "RW", "CAM", "LW", "ST"],
  },
  {
    code: "5-3-2",
    name: "5-3-2 Compact",
    lineupSlots: ["GK", "RWB", "CB", "CB", "CB", "LWB", "CM", "CM", "CM", "ST", "ST"],
  },
] as const;

export const FORMATION_CODES = FORMATIONS.map((formation) => formation.code);

export const TOTAL_DRAFT_SLOTS = 18;
export const REQUIRED_GOALKEEPERS = 2;
export const OPTIONS_PER_SLOT = 5;

const BENCH_SLOT_POSITION = "ANY";

export const POSITION_ALIASES: Record<string, string[]> = {
  GK: ["GK"],
  RB: ["RB", "RWB"],
  LB: ["LB", "LWB"],
  RWB: ["RWB", "RB"],
  LWB: ["LWB", "LB"],
  CB: ["CB"],
  CDM: ["CDM", "CM"],
  CM: ["CM", "CDM", "CAM"],
  CAM: ["CAM", "CM", "CF"],
  RM: ["RM", "RW"],
  LM: ["LM", "LW"],
  RW: ["RW", "RM", "RF"],
  LW: ["LW", "LM", "LF"],
  ST: ["ST", "CF"],
};

export const AI_TEAM_NAMES = [
  "Catalonia FC",
  "Northbridge United",
  "Blue Armada",
  "Orion Athletic",
  "Valley Rovers",
  "Metro City",
  "Iron Wolves",
  "Royal Thunder",
  "Emerald Stars",
  "Atlas XI",
  "Crimson Borough",
  "Skyline AFC",
];

export function getFormationByCode(code: string) {
  return FORMATIONS.find((formation) => formation.code === code);
}

export function getSlotPosition(formationCode: string, slotNo: number): string {
  const formation = getFormationByCode(formationCode) ?? FORMATIONS[0];

  if (slotNo <= formation.lineupSlots.length) {
    return formation.lineupSlots[slotNo - 1];
  }

  return BENCH_SLOT_POSITION;
}
