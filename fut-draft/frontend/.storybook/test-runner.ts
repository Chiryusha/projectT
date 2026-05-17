import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { TestRunnerConfig } from "@storybook/test-runner";
import { toMatchImageSnapshot } from "jest-image-snapshot";

const visualResultsDir = join(process.cwd(), "test-results", "storybook-visual");
const actualDir = join(visualResultsDir, "actual");
const diffDir = join(visualResultsDir, "diff");
const snapshotsDir = join(visualResultsDir, "snapshots");

const ensureVisualDirs = () => {
  mkdirSync(actualDir, { recursive: true });
  mkdirSync(diffDir, { recursive: true });
  mkdirSync(snapshotsDir, { recursive: true });
};

const config: TestRunnerConfig = {
  setup() {
    ensureVisualDirs();
    expect.extend({ toMatchImageSnapshot });
  },

  async postVisit(page, context) {
    if (context.tags?.includes("skip-visual")) {
      return;
    }

    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-delay: 0s !important;
          animation-duration: 0s !important;
          caret-color: transparent !important;
          transition-delay: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });

    await page.waitForLoadState("networkidle");
    await page.evaluate(async () => {
      await document.fonts?.ready;

      const urls = Array.from(document.querySelectorAll("#storybook-root *"))
        .flatMap((element) => {
          const backgroundImage = window.getComputedStyle(element).backgroundImage;

          return Array.from(backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g)).map(
            ([, url]) => url,
          );
        })
        .filter(Boolean);

      await Promise.all(
        urls.map(
          (url) =>
            new Promise<void>((resolve) => {
              const image = new Image();

              image.onload = () => resolve();
              image.onerror = () => resolve();
              image.src = url;
            }),
        ),
      );
    });

    const storyRoot = page.locator("#storybook-root");
    await storyRoot.waitFor({ state: "visible" });

    const screenshot = await storyRoot.screenshot();
    const snapshotName = context.id;

    writeFileSync(join(actualDir, `${snapshotName}.png`), screenshot);

    expect(screenshot).toMatchImageSnapshot({
      customDiffDir: diffDir,
      customSnapshotIdentifier: snapshotName,
      customSnapshotsDir: snapshotsDir,
      failureThreshold: 0.01,
      failureThresholdType: "percent",
    });
  },
};

export default config;
