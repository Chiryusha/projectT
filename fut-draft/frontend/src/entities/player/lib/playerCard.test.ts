import type { DraftPlayerCard } from "../model/types";
import {
  getAverageRating,
  getCardInitials,
  resolvePlayerImageUrl,
} from "./playerCard";

const createCard = (overall: number): DraftPlayerCard => ({
  basePosition: "ST",
  id: `card-${overall}`,
  overall,
  player: {
    club: "FUT Academy",
    fullName: `Player ${overall}`,
    imageUrl: null,
    league: "Elite League",
    nation: "Brazil",
  },
  rarity: "gold",
});

describe("playerCard helpers", () => {
  it("builds two-letter initials from a full name", () => {
    expect(getCardInitials("Kylian Mbappe")).toBe("KM");
    expect(getCardInitials("Ronaldo")).toBe("R");
    expect(getCardInitials("  alex   volkov  ")).toBe("AV");
  });

  it("calculates rounded average rating from picked cards", () => {
    const picks = [
      { playerCard: createCard(90) },
      { playerCard: createCard(85) },
      { playerCard: createCard(84) },
    ];

    expect(getAverageRating(picks)).toBe(86);
  });

  it("returns zero average rating for an empty picks list", () => {
    expect(getAverageRating([])).toBe(0);
  });

  it("keeps backend relative player image urls relative for same-origin deploy", () => {
    expect(resolvePlayerImageUrl("/player-images/card.png")).toBe(
      "/player-images/card.png",
    );
  });

  it("keeps external and already plain image urls unchanged", () => {
    expect(resolvePlayerImageUrl("https://cdn.test/card.png")).toBe(
      "https://cdn.test/card.png",
    );
    expect(resolvePlayerImageUrl("local-card.png")).toBe("local-card.png");
    expect(resolvePlayerImageUrl(null)).toBeNull();
  });
});
