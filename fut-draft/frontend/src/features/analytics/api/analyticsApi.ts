import { API_BASE_URL } from "@/shared/api/httpClient";

type FrontendLogLevel = "error" | "info" | "warning";

type FrontendLogPayload = {
  event: string;
  level: FrontendLogLevel;
  message?: string;
  page?: string;
  source?: string;
};

const MAX_EVENT_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 240;
const MAX_PAGE_LENGTH = 120;

const isAnalyticsEnabled = () => {
  return import.meta.env.VITE_ANALYTICS_ENABLED !== "false";
};

const trimForMetric = (value: string, maxLength: number) => {
  return value.trim().slice(0, maxLength);
};

const sendAnalyticsPayload = (endpoint: string, payload: unknown) => {
  if (!isAnalyticsEnabled()) {
    return;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  void fetch(url, {
    body: JSON.stringify(payload),
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
    method: "POST",
    mode: "cors",
  }).catch(() => undefined);
};

const normalizePage = (page: string | undefined) => {
  const trimmedPage = trimForMetric(page ?? "/", MAX_PAGE_LENGTH);

  if (!trimmedPage) {
    return "/";
  }

  return trimmedPage;
};

export const trackPageView = (page: string) => {
  sendAnalyticsPayload("/analytics/page-view", {
    page: normalizePage(page),
  });
};

export const trackFrontendEvent = (event: string, page: string) => {
  sendAnalyticsPayload("/analytics/event", {
    event: trimForMetric(event, MAX_EVENT_LENGTH),
    page: normalizePage(page),
  });
};

export const trackFrontendLog = ({
  event,
  level,
  message,
  page,
  source,
}: FrontendLogPayload) => {
  sendAnalyticsPayload("/analytics/event", {
    event: trimForMetric(event, MAX_EVENT_LENGTH),
    level,
    message: message ? trimForMetric(message, MAX_MESSAGE_LENGTH) : undefined,
    page: normalizePage(page ?? window.location.pathname),
    source: source ? trimForMetric(source, MAX_EVENT_LENGTH) : undefined,
  });
};
