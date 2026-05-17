jest.mock("@/shared/api", () => ({
  apiRequest: jest.fn(),
  createAuthHeaders: jest.fn((accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
  })),
}));

import { apiRequest, createAuthHeaders } from "@/shared/api";

import { getProfileRequest, updateProfileRequest } from "./profileApi";

describe("profileApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiRequest).mockResolvedValue({});
  });

  it("loads current profile with auth headers", async () => {
    await getProfileRequest("access-token");

    expect(createAuthHeaders).toHaveBeenCalledWith("access-token");
    expect(apiRequest).toHaveBeenCalledWith("/users/me", {
      headers: { Authorization: "Bearer access-token" },
      method: "GET",
    });
  });

  it("updates profile avatar with auth headers", async () => {
    await updateProfileRequest("access-token", "data:image/png;base64,avatar");

    expect(apiRequest).toHaveBeenCalledWith("/users/me", {
      body: { avatarUrl: "data:image/png;base64,avatar" },
      headers: { Authorization: "Bearer access-token" },
      method: "PATCH",
    });
  });

  it("allows clearing profile avatar", async () => {
    await updateProfileRequest("access-token", null);

    expect(apiRequest).toHaveBeenCalledWith("/users/me", {
      body: { avatarUrl: null },
      headers: { Authorization: "Bearer access-token" },
      method: "PATCH",
    });
  });
});
