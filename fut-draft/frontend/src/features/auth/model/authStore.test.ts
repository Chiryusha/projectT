import type { AuthResponse, LoginPayload, RegisterPayload } from "./types";

jest.mock("../api/authApi", () => ({
  loginRequest: jest.fn(),
  logoutRequest: jest.fn(),
  meRequest: jest.fn(),
  refreshRequest: jest.fn(),
  registerRequest: jest.fn(),
}));

import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
} from "../api/authApi";
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  useAuthStore,
} from "./authStore";

const authResponse: AuthResponse = {
  tokens: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    tokenType: "Bearer",
  },
  user: {
    email: "demo@futdraft.local",
    id: "user-id",
    nickname: "demo_user",
  },
};

const resetAuthStoreState = () => {
  useAuthStore.setState({
    accessToken: null,
    error: null,
    refreshToken: null,
    status: "guest",
    user: null,
  });
};

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    resetAuthStoreState();
  });

  it("stores tokens and user after successful login", async () => {
    const payload: LoginPayload = {
      email: "demo@futdraft.local",
      password: "Demo12345!",
    };

    jest.mocked(loginRequest).mockResolvedValue(authResponse);

    await expect(useAuthStore.getState().login(payload)).resolves.toEqual(
      authResponse.user,
    );

    expect(loginRequest).toHaveBeenCalledWith(payload);
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "access-token",
      error: null,
      refreshToken: "refresh-token",
      status: "authenticated",
      user: authResponse.user,
    });
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe("access-token");
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe("refresh-token");
    expect(JSON.parse(localStorage.getItem(AUTH_USER_STORAGE_KEY) ?? "{}")).toEqual(
      authResponse.user,
    );
  });

  it("stores tokens and user after successful registration", async () => {
    const payload: RegisterPayload = {
      email: "draft_boss@example.com",
      nickname: "draft_boss",
      password: "Demo12345!",
    };

    jest.mocked(registerRequest).mockResolvedValue(authResponse);

    await useAuthStore.getState().register(payload);

    expect(registerRequest).toHaveBeenCalledWith(payload);
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe("access-token");
  });

  it("initializes authenticated state when stored access token is valid", async () => {
    jest.mocked(meRequest).mockResolvedValue(authResponse.user);
    useAuthStore.setState({
      accessToken: "stored-access-token",
      refreshToken: "stored-refresh-token",
      status: "checking",
      user: null,
    });

    await useAuthStore.getState().initialize();

    expect(meRequest).toHaveBeenCalledWith("stored-access-token");
    expect(refreshRequest).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      user: authResponse.user,
    });
  });

  it("refreshes session when stored access token is expired", async () => {
    jest.mocked(meRequest).mockRejectedValue(new Error("Unauthorized"));
    jest.mocked(refreshRequest).mockResolvedValue(authResponse);
    useAuthStore.setState({
      accessToken: "expired-access-token",
      refreshToken: "stored-refresh-token",
      status: "checking",
      user: null,
    });

    await useAuthStore.getState().initialize();

    expect(refreshRequest).toHaveBeenCalledWith("stored-refresh-token");
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      status: "authenticated",
      user: authResponse.user,
    });
  });

  it("clears local session on logout", async () => {
    jest.mocked(logoutRequest).mockResolvedValue({ success: true });
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, "access-token");
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, "refresh-token");
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(authResponse.user));
    useAuthStore.setState({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      status: "authenticated",
      user: authResponse.user,
    });

    await useAuthStore.getState().logout();

    expect(logoutRequest).toHaveBeenCalledWith("access-token");
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      error: null,
      refreshToken: null,
      status: "guest",
      user: null,
    });
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();
  });
});
