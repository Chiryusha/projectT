const path = require("node:path");

const { getJestConfig } = require("@storybook/test-runner");

const testRunnerConfig = getJestConfig();
const frontendRoot = path.resolve(__dirname, "..");

module.exports = {
  ...testRunnerConfig,
  rootDir: frontendRoot,
  testEnvironmentOptions: {
    ...testRunnerConfig.testEnvironmentOptions,
    "jest-playwright": {
      ...testRunnerConfig.testEnvironmentOptions?.["jest-playwright"],
      browsers: ["chromium"],
      exitOnPageError: false,
      launchOptions: {
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
        headless: true,
      },
      launchType: "LAUNCH",
    },
  },
  testPathIgnorePatterns: [
    ...(testRunnerConfig.testPathIgnorePatterns ?? []),
    "<rootDir>/dist/",
    "<rootDir>/node_modules/",
    "<rootDir>/storybook-static/",
  ],
};
