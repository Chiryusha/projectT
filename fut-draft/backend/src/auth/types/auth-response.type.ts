export type AuthUserResponse = {
  id: string;
  nickname: string;
  email: string;
  avatarUrl: string | null;
  createdAt?: string;
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
};

export type AuthResponse = {
  user: AuthUserResponse;
  tokens: AuthTokensResponse;
};

export type LogoutResponse = {
  success: boolean;
};
