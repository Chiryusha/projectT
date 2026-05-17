export type DraftPlayer = {
  fullName: string;
  nation: string;
  club: string;
  league: string;
  imageUrl: string | null;
};

export type DraftPlayerCard = {
  id: string;
  overall: number;
  basePosition: string;
  rarity: string;
  player: DraftPlayer;
};
