jest.mock("@/shared/api", () => ({
  apiRequest: jest.fn(),
  createAuthHeaders: jest.fn((accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
  })),
}));

import { apiRequest, createAuthHeaders } from "@/shared/api";

import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
} from "./authApi";

describe("authApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiRequest).mockResolvedValue({});
  });

  it("sends login payload to auth login endpoint", async () => {
    const payload = {
      email: "demo@futdraft.local",
      password: "Demo12345!",
    };

    await loginRequest(payload);

    expect(apiRequest).toHaveBeenCalledWith("/auth/login", {
      body: payload,
      method: "POST",
    });
  });

  it("sends register payload to auth register endpoint", async () => {
    const payload = {
      email: "draft_boss@example.com",
      nickname: "draft_boss",
      password: "Demo12345!",
    };

    await registerRequest(payload);

    expect(apiRequest).toHaveBeenCalledWith("/auth/register", {
      body: payload,
      method: "POST",
    });
  });

  it("refreshes session by refresh token", async () => {
    await refreshRequest("refresh-token");

    expect(apiRequest).toHaveBeenCalledWith("/auth/refresh", {
      body: { refreshToken: "refresh-token" },
      method: "POST",
    });
  });

  it("loads current user with auth headers", async () => {
    await meRequest("access-token");

    expect(createAuthHeaders).toHaveBeenCalledWith("access-token");
    expect(apiRequest).toHaveBeenCalledWith("/auth/me", {
      headers: { Authorization: "Bearer access-token" },
      method: "GET",
    });
  });

  it("logs out current session with auth headers", async () => {
    await logoutRequest("access-token");

    expect(apiRequest).toHaveBeenCalledWith("/auth/logout", {
      headers: { Authorization: "Bearer access-token" },
      method: "POST",
    });
  });
});
