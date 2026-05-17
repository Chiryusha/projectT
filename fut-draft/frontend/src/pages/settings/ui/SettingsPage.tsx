import { Link } from "react-router-dom";

import type { AiDifficulty, MatchSpeed } from "@/shared/config/gameSettings";
import { useGameSettingsStore } from "@/features/settings";
import { RoutePath } from "@/shared";

type SettingOption<T extends string> = {
  description: string;
  label: string;
  value: T;
};

const aiDifficultyOptions: Array<SettingOption<AiDifficulty>> = [
  {
    description: "Соперники слабее по силе и сыгранности.",
    label: "Легко",
    value: "easy",
  },
  {
    description: "Баланс между рейтингом состава и случайностью.",
    label: "Нормально",
    value: "normal",
  },
  {
    description: "ИИ получает более сильные команды.",
    label: "Сложно",
    value: "hard",
  },
];

const matchSpeedOptions: Array<SettingOption<MatchSpeed>> = [
  {
    description: "Матч длится 30 секунд.",
    label: "Быстро",
    value: "fast",
  },
  {
    description: "Матч длится 50 секунд.",
    label: "Обычно",
    value: "normal",
  },
  {
    description: "Матч длится 70 секунд.",
    label: "Медленно",
    value: "slow",
  },
];

const SettingsPage = () => {
  const aiDifficulty = useGameSettingsStore((state) => state.aiDifficulty);
  const matchSpeed = useGameSettingsStore((state) => state.matchSpeed);
  const resetSettings = useGameSettingsStore((state) => state.resetSettings);
  const setAiDifficulty = useGameSettingsStore(
    (state) => state.setAiDifficulty,
  );
  const setMatchSpeed = useGameSettingsStore((state) => state.setMatchSpeed);

  return (
    <main className="min-h-screen bg-[#07110f] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          className="mb-4 inline-flex h-10 items-center rounded-[8px] border border-white/15 px-4 text-sm font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-lime-300/60 hover:text-white"
          to={RoutePath.main}
        >
          Назад
        </Link>
        <div className="rounded-[8px] border border-white/10 bg-slate-950/90 p-5 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
            Game settings
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black">Настройки</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold text-white/55">
                Эти параметры сохраняются в браузере и применяются к новым
                турнирам.
              </p>
            </div>
            <button
              className="h-10 rounded-[8px] border border-white/15 px-4 text-sm font-black uppercase text-white/70 transition hover:border-white/35 hover:text-white"
              onClick={resetSettings}
              type="button"
            >
              Сбросить
            </button>
          </div>
        </div>

        <section className="mt-5 rounded-[8px] border border-white/10 bg-slate-950/80 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Tournament AI
            </p>
            <h2 className="mt-1 text-2xl font-black">Сложность ИИ</h2>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {aiDifficultyOptions.map((option) => {
              const isSelected = option.value === aiDifficulty;

              return (
                <button
                  className={
                    isSelected
                      ? "rounded-[8px] border border-lime-300 bg-lime-300/15 p-4 text-left shadow-[0_0_24px_rgba(190,242,100,0.16)]"
                      : "rounded-[8px] border border-white/10 bg-white/[0.045] p-4 text-left transition hover:border-lime-300/60 hover:bg-white/[0.075]"
                  }
                  key={option.value}
                  onClick={() => setAiDifficulty(option.value)}
                  type="button"
                >
                  <span className="text-lg font-black text-white">
                    {option.label}
                  </span>
                  <span className="mt-2 block text-sm font-bold text-white/55">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-[8px] border border-white/10 bg-slate-950/80 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-200">
              Match simulation
            </p>
            <h2 className="mt-1 text-2xl font-black">Скорость матча</h2>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {matchSpeedOptions.map((option) => {
              const isSelected = option.value === matchSpeed;

              return (
                <button
                  className={
                    isSelected
                      ? "rounded-[8px] border border-cyan-200 bg-cyan-200/15 p-4 text-left shadow-[0_0_24px_rgba(103,232,249,0.16)]"
                      : "rounded-[8px] border border-white/10 bg-white/[0.045] p-4 text-left transition hover:border-cyan-200/60 hover:bg-white/[0.075]"
                  }
                  key={option.value}
                  onClick={() => setMatchSpeed(option.value)}
                  type="button"
                >
                  <span className="text-lg font-black text-white">
                    {option.label}
                  </span>
                  <span className="mt-2 block text-sm font-bold text-white/55">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default SettingsPage;
