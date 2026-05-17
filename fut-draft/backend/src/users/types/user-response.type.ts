import type { AuthUserResponse } from "../../auth/types/auth-response.type";

export type UserProfileStatsResponse = {
  savedSquads: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
};

export type UserProfileResponse = AuthUserResponse & {
  createdAt: string;
  stats: UserProfileStatsResponse;
};
