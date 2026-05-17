import { PlayerCard } from "@/entities/player";

import type { DraftSessionState } from "../../model/types";

type OptionsPanelProps = {
  disabled: boolean;
  onPick: (cardId: string) => void;
  sessionState: DraftSessionState;
};

const OptionsPanel = ({ disabled, onPick, sessionState }: OptionsPanelProps) => {
  if (sessionState.session.status !== "IN_PROGRESS") {
    return (
      <section className="rounded-[8px] border border-lime-300/30 bg-lime-300/10 p-5 text-white">
        <h2 className="text-2xl font-black">Состав собран</h2>
        <p className="mt-2 text-sm text-white/65">
          Все 18 слотов заполнены. Теперь можно стартовать турнир.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-white/10 bg-slate-950/90 p-5 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
            Player pick
          </p>
          <h2 className="mt-1 text-2xl font-black">
            Слот {sessionState.session.currentSlot} из{" "}
            {sessionState.session.totalSlots}
          </h2>
        </div>
        <div className="rounded-[8px] bg-white/10 px-4 py-3 text-sm font-bold text-white/70">
          GK: {sessionState.session.goalkeepersPicked}/
          {sessionState.session.goalkeepersRequired}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {sessionState.options.map((option) => (
          <PlayerCard
            card={option.playerCard}
            disabled={disabled}
            key={option.playerCard.id}
            onSelect={onPick}
          />
        ))}
      </div>
    </section>
  );
};

export default OptionsPanel;
