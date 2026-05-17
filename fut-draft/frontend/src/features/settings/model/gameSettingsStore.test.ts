const GAME_SETTINGS_STORAGE_KEY = "gameSettings";

const loadStore = async () => {
  jest.resetModules();

  return import("./gameSettingsStore");
};

describe("useGameSettingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses default settings when local storage is empty", async () => {
    const { useGameSettingsStore } = await loadStore();

    expect(useGameSettingsStore.getState()).toMatchObject({
      aiDifficulty: "normal",
      matchSpeed: "normal",
    });
  });

  it("persists selected difficulty and match speed", async () => {
    const { useGameSettingsStore } = await loadStore();

    useGameSettingsStore.getState().setAiDifficulty("hard");
    useGameSettingsStore.getState().setMatchSpeed("fast");

    expect(useGameSettingsStore.getState()).toMatchObject({
      aiDifficulty: "hard",
      matchSpeed: "fast",
    });
    expect(JSON.parse(localStorage.getItem(GAME_SETTINGS_STORAGE_KEY) ?? "{}")).toEqual({
      aiDifficulty: "hard",
      matchSpeed: "fast",
    });
  });

  it("falls back to defaults for invalid stored settings", async () => {
    localStorage.setItem(
      GAME_SETTINGS_STORAGE_KEY,
      JSON.stringify({ aiDifficulty: "nightmare", matchSpeed: "instant" }),
    );

    const { useGameSettingsStore } = await loadStore();

    expect(useGameSettingsStore.getState()).toMatchObject({
      aiDifficulty: "normal",
      matchSpeed: "normal",
    });
  });

  it("resets settings and persisted value to defaults", async () => {
    const { useGameSettingsStore } = await loadStore();

    useGameSettingsStore.getState().setAiDifficulty("easy");
    useGameSettingsStore.getState().setMatchSpeed("slow");
    useGameSettingsStore.getState().resetSettings();

    expect(useGameSettingsStore.getState()).toMatchObject({
      aiDifficulty: "normal",
      matchSpeed: "normal",
    });
    expect(JSON.parse(localStorage.getItem(GAME_SETTINGS_STORAGE_KEY) ?? "{}")).toEqual({
      aiDifficulty: "normal",
      matchSpeed: "normal",
    });
  });
});
