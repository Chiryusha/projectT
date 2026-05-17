import { expect, test as base } from "@playwright/test";

type ConsoleErrorGuard = {
  consoleErrorGuard: void;
};

const ignoredUrlFragments = ["/api/metrics"];

const shouldIgnoreUrl = (url: string) => {
  return ignoredUrlFragments.some((fragment) => url.includes(fragment));
};

export const test = base.extend<ConsoleErrorGuard>({
  consoleErrorGuard: [
    async ({ page }, use) => {
      const errors: string[] = [];

      page.on("console", (message) => {
        if (message.type() === "error") {
          errors.push(`console.error: ${message.text()}`);
        }
      });

      page.on("pageerror", (error) => {
        errors.push(`pageerror: ${error.message}`);
      });

      page.on("requestfailed", (request) => {
        const url = request.url();

        if (shouldIgnoreUrl(url)) {
          return;
        }

        errors.push(
          `requestfailed: ${request.method()} ${url} ${request.failure()?.errorText ?? "failed"}`,
        );
      });

      page.on("response", (response) => {
        const status = response.status();
        const url = response.url();

        if (status < 400 || shouldIgnoreUrl(url)) {
          return;
        }

        errors.push(`response ${status}: ${url}`);
      });

      await use();

      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
