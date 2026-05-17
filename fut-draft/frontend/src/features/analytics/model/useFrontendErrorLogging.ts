import { useEffect } from "react";

import { trackFrontendLog } from "../api/analyticsApi";

const getErrorMessage = (reason: unknown) => {
  if (reason instanceof Error) {
    return reason.message;
  }

  if (typeof reason === "string") {
    return reason;
  }

  try {
    return JSON.stringify(reason);
  } catch {
    return "Unknown frontend error";
  }
};

const getResourceSource = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  return (
    target.getAttribute("src") ??
    target.getAttribute("href") ??
    target.getAttribute("data-src") ??
    target.tagName.toLowerCase()
  );
};

export const useFrontendErrorLogging = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent | Event) => {
      if (!(event instanceof ErrorEvent)) {
        const source = getResourceSource(event.target);

        trackFrontendLog({
          event: "resource_load_error",
          level: "warning",
          message: source ?? "Resource failed to load",
          source: source ?? undefined,
        });
        event.preventDefault();

        return;
      }

      trackFrontendLog({
        event: "runtime_error",
        level: "error",
        message: event.message,
        source: event.filename,
      });
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackFrontendLog({
        event: "unhandled_rejection",
        level: "error",
        message: getErrorMessage(event.reason),
      });
      event.preventDefault();
    };

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
};
