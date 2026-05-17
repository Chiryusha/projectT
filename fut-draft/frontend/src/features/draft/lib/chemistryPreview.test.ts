import type { DraftFormation, DraftPick, DraftPlayerCard } from "../model/types";
import { calculateDraftChemistryPreview } from "./chemistryPreview";

const formation: DraftFormation = {
  benchSlots: 7,
  code: "4-3-3",
  lineupSlots: ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"],
  name: "4-3-3 Attack",
  requiredGoalkeepers: 2,
  totalSlots: 18,
};

const createCard = ({
  basePosition,
  club = "FUT Academy",
  league = "Elite League",
  nation = "Brazil",
  name,
  overall = 85,
}: {
  basePosition: string;
  club?: string;
  league?: string;
  nation?: string;
  name: string;
  overall?: number;
}): DraftPlayerCard => ({
  basePosition,
  id: `card-${name}`,
  overall,
  player: {
    club,
    fullName: name,
    imageUrl: null,
    league,
    nation,
  },
  rarity: "gold",
});

const createPick = (slotNo: number, playerCard: DraftPlayerCard): DraftPick => ({
  pickedAt: "2026-05-15T10:00:00.000Z",
  playerCard,
  slotNo,
});

describe("calculateDraftChemistryPreview", () => {
  it("returns zero chemistry when there are no starters", () => {
    const preview = calculateDraftChemistryPreview([], formation);

    expect(preview.teamChemistry).toBe(0);
    expect(preview.players.size).toBe(0);
  });

  it("adds chemistry for correct position, same club, same league and same nation", () => {
    const picks = [
      createPick(1, createCard({ basePosition: "GK", name: "Mateo Keeper" })),
      createPick(10, createCard({ basePosition: "ST", name: "Alex Striker" })),
    ];

    const preview = calculateDraftChemistryPreview(picks, formation);

    expect(preview.players.get(1)).toBe(5);
    expect(preview.players.get(10)).toBe(5);
    expect(preview.teamChemistry).toBe(18);
  });

  it("gives no chemistry when a starter has wrong position and no links", () => {
    const picks = [
      createPick(
        1,
        createCard({
          basePosition: "ST",
          club: "Northbridge",
          league: "Premier League",
          nation: "England",
          name: "Wrong Position",
        }),
      ),
    ];

    const preview = calculateDraftChemistryPreview(picks, formation);

    expect(preview.players.get(1)).toBe(0);
    expect(preview.teamChemistry).toBe(0);
  });

  it("ignores bench picks in team chemistry calculation", () => {
    const picks = [
      createPick(1, createCard({ basePosition: "GK", name: "Mateo Keeper" })),
      createPick(12, createCard({ basePosition: "CM", name: "Bench Player" })),
    ];

    const preview = calculateDraftChemistryPreview(picks, formation);

    expect(preview.players.has(12)).toBe(false);
    expect(preview.players.get(1)).toBe(1);
    expect(preview.teamChemistry).toBe(2);
  });
});
