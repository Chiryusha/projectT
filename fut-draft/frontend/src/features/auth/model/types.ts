import type { AuthUser } from "@/entities/user";

export type { AuthUser } from "@/entities/user";

export type AuthStatus = "checking" | "guest" | "authenticated" | "loading";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  nickname: string;
};
