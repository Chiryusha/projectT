import { ApiError, apiRequest, createAuthHeaders, isApiError } from "./httpClient";

const createResponse = (body: string, status = 200): Response => {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
};

describe("httpClient", () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("serializes request body as json and parses json response", async () => {
    fetchMock.mockResolvedValue(createResponse(JSON.stringify({ ok: true })));

    const result = await apiRequest<{ ok: boolean }>("/draft", {
      body: { formation: "4-3-3" },
      method: "POST",
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(result).toEqual({ ok: true });
    expect(url).toBe("/api/draft");
    expect(init.body).toBe(JSON.stringify({ formation: "4-3-3" }));
    expect((init.headers as Headers).get("Content-Type")).toBe("application/json");
  });

  it("does not overwrite explicitly provided content type", async () => {
    fetchMock.mockResolvedValue(createResponse("{}"));

    await apiRequest("/upload", {
      body: "raw-body",
      headers: { "Content-Type": "text/plain" },
      method: "POST",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect((init.headers as Headers).get("Content-Type")).toBe("text/plain");
    expect(init.body).toBe(JSON.stringify("raw-body"));
  });

  it("returns null when response body is empty", async () => {
    fetchMock.mockResolvedValue(createResponse(""));

    await expect(apiRequest<null>("/health")).resolves.toBeNull();
  });

  it("throws ApiError with normalized backend message", async () => {
    fetchMock.mockResolvedValue(
      createResponse(
        JSON.stringify({ message: ["Email is invalid", "Password is short"] }),
        400,
      ),
    );

    await expect(apiRequest("/auth/login")).rejects.toMatchObject({
      body: { message: ["Email is invalid", "Password is short"] },
      message: "Email is invalid. Password is short",
      status: 400,
    });
  });

  it("detects ApiError instances", () => {
    const error = new ApiError(401, { message: "Unauthorized" });

    expect(isApiError(error)).toBe(true);
    expect(isApiError(new Error("Nope"))).toBe(false);
  });

  it("creates authorization header for bearer token", () => {
    expect(createAuthHeaders("access-token")).toEqual({
      Authorization: "Bearer access-token",
    });
  });
});
