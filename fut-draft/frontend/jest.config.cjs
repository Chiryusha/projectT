module.exports = {
  clearMocks: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|scss|sass)$": "<rootDir>/src/shared/testing/styleMock.cjs",
    "\\.(png|jpg|jpeg|gif|webp|svg)$": "<rootDir>/src/shared/testing/fileMock.cjs",
  },
  restoreMocks: true,
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest",
  },
};
