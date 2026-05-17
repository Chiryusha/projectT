import type { DraftPlayerCard } from "../model/types";

type PickWithPlayerCard = {
  playerCard: DraftPlayerCard;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const API_ASSET_ORIGIN = (() => {
  if (
    !API_BASE_URL.startsWith("http://") &&
    !API_BASE_URL.startsWith("https://")
  ) {
    return "";
  }

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
})();

export const getCardInitials = (fullName: string) => {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export const getAverageRating = (picks: PickWithPlayerCard[]) => {
  if (picks.length === 0) {
    return 0;
  }

  const total = picks.reduce((sum, pick) => sum + pick.playerCard.overall, 0);

  return Math.round(total / picks.length);
};

export const resolvePlayerImageUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${API_ASSET_ORIGIN}${imageUrl}`;
  }

  return imageUrl;
};
