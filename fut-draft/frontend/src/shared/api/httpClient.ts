const normalizeBaseUrl = (baseUrl: string) => {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? "/api",
);

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};
//Добавил поле body чтобы брать объекты при fetch

const isApiErrorBody = (body: unknown): body is ApiErrorBody => {
  return typeof body === "object" && body !== null;
};

const getErrorMessage = (status: number, body: unknown) => {
  if (isApiErrorBody(body)) {
    const { message, error } = body;

    if (Array.isArray(message)) {
      return message.join(". ");
    }

    if (typeof message === "string") {
      return message;
    }

    if (typeof error === "string") {
      return error;
    }
  }

  return `Request failed with status ${status}`;
};

const parseResponseBody = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const buildApiUrl = (endpoint: string) => {
  if (endpoint.startsWith("http")) {
    return endpoint;
  }

  return `${API_BASE_URL}${endpoint}`;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(getErrorMessage(status, body));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const apiRequest = async <T>(
  endpoint: string,
  { body, headers, ...options }: ApiRequestOptions = {},
): Promise<T> => {
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: requestHeaders,
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, responseBody);
  }

  return responseBody as T;
};

export const createAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});
