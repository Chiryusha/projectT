import { expect, type APIRequestContext, type Page } from "@playwright/test";

const API_BASE_URL = "http://127.0.0.1:3001/api";

type AuthResponse = {
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
  };
  user: {
    avatarUrl?: string | null;
    email: string;
    id: string;
    nickname: string;
  };
};

type DraftOption = {
  playerCard: {
    id: string;
  };
};

type DraftSessionState = {
  options: DraftOption[];
  session: {
    id: string;
    status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  };
};

export type TestAccount = {
  auth: AuthResponse;
  email: string;
  nickname: string;
  password: string;
};

export const createUniqueCredentials = () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 100_000)}`;

  return {
    email: `e2e-${suffix}@futdraft.local`,
    nickname: `e2e_${suffix}`.slice(0, 24),
    password: "Demo12345!",
  };
};

export const registerAccountByApi = async (
  request: APIRequestContext,
): Promise<TestAccount> => {
  const credentials = createUniqueCredentials();
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: credentials,
  });

  expect(response.ok()).toBeTruthy();

  return {
    ...credentials,
    auth: (await response.json()) as AuthResponse,
  };
};

export const addAuthSession = async (page: Page, auth: AuthResponse) => {
  await page.addInitScript((session) => {
    window.localStorage.setItem("accessToken", session.tokens.accessToken);
    window.localStorage.setItem("refreshToken", session.tokens.refreshToken);
    window.localStorage.setItem("authUser", JSON.stringify(session.user));
  }, auth);
};

const authHeaders = (auth: AuthResponse) => ({
  Authorization: `Bearer ${auth.tokens.accessToken}`,
});

export const createCompletedDraftByApi = async (
  request: APIRequestContext,
  auth: AuthResponse,
) => {
  const createResponse = await request.post(`${API_BASE_URL}/draft/sessions`, {
    data: { formation: "4-3-3" },
    headers: authHeaders(auth),
  });

  expect(createResponse.ok()).toBeTruthy();

  let sessionState = (await createResponse.json()) as DraftSessionState;
  const sessionId = sessionState.session.id;

  for (let slotNo = 1; slotNo <= 18; slotNo += 1) {
    const optionsResponse = await request.get(
      `${API_BASE_URL}/draft/sessions/${sessionId}/options/${slotNo}`,
      { headers: authHeaders(auth) },
    );

    expect(optionsResponse.ok()).toBeTruthy();

    const optionsState = (await optionsResponse.json()) as DraftSessionState;
    const option = optionsState.options[0];

    expect(option, `slot ${slotNo} should have at least one draft option`).toBeTruthy();

    const pickResponse = await request.post(
      `${API_BASE_URL}/draft/sessions/${sessionId}/pick`,
      {
        data: {
          playerCardId: option.playerCard.id,
          slotNo,
        },
        headers: authHeaders(auth),
      },
    );

    expect(pickResponse.ok()).toBeTruthy();
    sessionState = (await pickResponse.json()) as DraftSessionState;
  }

  expect(sessionState.session.status).toBe("COMPLETED");

  return sessionState;
};

export const saveSquadByApi = async (
  request: APIRequestContext,
  auth: AuthResponse,
  sessionId: string,
  name: string,
) => {
  const response = await request.post(
    `${API_BASE_URL}/draft/sessions/${sessionId}/saved-squad`,
    {
      data: { name },
      headers: authHeaders(auth),
    },
  );

  expect(response.ok()).toBeTruthy();

  return response.json();
};

export const startTournamentByApi = async (
  request: APIRequestContext,
  auth: AuthResponse,
  sessionId: string,
) => {
  const response = await request.post(
    `${API_BASE_URL}/draft/sessions/${sessionId}/tournament/start`,
    {
      data: { aiDifficulty: "easy" },
      headers: authHeaders(auth),
    },
  );

  expect(response.ok()).toBeTruthy();

  return response.json();
};
