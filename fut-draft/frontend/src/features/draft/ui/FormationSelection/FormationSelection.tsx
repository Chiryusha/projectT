import { Link } from "react-router-dom";

import { FormationPreview } from "@/entities/formation";
import stadiumBackground from "@/shared/assets/first-page.jpg";
import { RoutePath } from "@/shared";

import type { DraftFormation, DraftStatus } from "../../model/types";

type FormationSelectionProps = {
  formations: DraftFormation[];
  selectedFormation: DraftFormation | null;
  status: DraftStatus;
  onCreate: () => void;
  onSelect: (formationCode: string) => void;
};

const FormationSelection = ({
  formations,
  selectedFormation,
  status,
  onCreate,
  onSelect,
}: FormationSelectionProps) => {
  const isCreating = status === "creating";

  return (
    <div className="grid min-h-screen bg-[#090d14] text-white lg:grid-cols-[360px_1fr]">
      <aside className="border-r border-white/10 bg-slate-950/95 p-5">
        <Link
          className="text-xs font-black uppercase tracking-[0.2em] text-white/55 hover:text-white"
          to={RoutePath.main}
        >
          FUT Draft
        </Link>
        <h1 className="mt-8 text-3xl font-black uppercase">Выбор схемы</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Выбери стартовую схему. Собери состав своей мечты и победи в турнире на вылет.
        </p>

        <div className="mt-8 space-y-3">
          {formations.map((formation) => {
            const isSelected = formation.code === selectedFormation?.code;

            return (
              <button
                className={
                  isSelected
                    ? "flex w-full items-center justify-between rounded-[8px] border border-lime-300 bg-violet-600 px-4 py-3 text-left shadow-[0_0_22px_rgba(132,204,22,0.24)]"
                    : "flex w-full items-center justify-between rounded-[8px] border border-white/10 bg-slate-900 px-4 py-3 text-left transition hover:border-lime-300/70 hover:bg-slate-800"
                }
                data-testid={`formation-${formation.code}`}
                key={formation.code}
                onClick={() => onSelect(formation.code)}
                type="button"
              >
                <span>
                  <span className="block text-lg font-black">{formation.code}</span>
                  <span className="text-xs font-bold uppercase text-white/55">
                    {formation.name}
                  </span>
                </span>
                <span className="text-sm font-black text-lime-200">
                  {formation.lineupSlots.length}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <main
        className="relative grid min-h-screen place-items-center overflow-hidden bg-cover bg-center p-5"
        style={{ backgroundImage: `url(${stadiumBackground})` }}
      >
        <div className="absolute inset-0 bg-black/72" />
        <section className="relative grid w-full max-w-5xl gap-6 rounded-[8px] border border-white/10 bg-slate-950/80 p-5 shadow-2xl lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-300">
              Formation
            </p>
            <h2 className="mt-3 text-5xl font-black">{selectedFormation?.code}</h2>
            <p className="mt-2 text-xl font-bold text-white/70">
              {selectedFormation?.name}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-white/10 p-4">
                <div className="text-2xl font-black">
                  {selectedFormation?.lineupSlots.length ?? 0}
                </div>
                <div className="text-xs font-bold uppercase text-white/50">старт</div>
              </div>
              <div className="rounded-[8px] bg-white/10 p-4">
                <div className="text-2xl font-black">
                  {selectedFormation?.benchSlots ?? 0}
                </div>
                <div className="text-xs font-bold uppercase text-white/50">замен</div>
              </div>
            </div>
            <button
              className="mt-8 h-12 rounded-[8px] bg-lime-300 px-6 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
              data-testid="draft-create-session"
              disabled={!selectedFormation || isCreating}
              onClick={onCreate}
              type="button"
            >
              {isCreating ? "Создаем сессию..." : "Начать драфт"}
            </button>
          </div>

          {selectedFormation ? <FormationPreview formation={selectedFormation} /> : null}
        </section>
      </main>
    </div>
  );
};

export default FormationSelection;
