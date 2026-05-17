export type AuthUser = {
  id: string;
  nickname: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type UserProfileStats = {
  savedSquads: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
};

export type UserProfile = AuthUser & {
  avatarUrl: string | null;
  createdAt: string;
  stats: UserProfileStats;
};
