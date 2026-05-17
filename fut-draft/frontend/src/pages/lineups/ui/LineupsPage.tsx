import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getLayoutForFormation } from "@/entities/formation";
import { MiniPickedCard } from "@/entities/player";
import type { SavedSquad, SavedSquadPick } from "@/entities/saved-squad";
import { SavedSquadCard } from "@/entities/saved-squad";
import { useSavedSquadsStore } from "@/features/savedSquads";
import { Loader, RoutePath } from "@/shared";
import stadiumBackground from "@/shared/assets/first-page.jpg";

const buildFormationForSavedSquad = (squad: SavedSquad) => {
  const starters = squad.snapshot.picks
    .filter((pick) => pick.slotNo <= 11)
    .sort((first, second) => first.slotNo - second.slotNo);

  return {
    benchSlots: Math.max(squad.snapshot.picks.length - 11, 0),
    code: squad.formation,
    lineupSlots: starters.map((pick) => pick.playerCard.basePosition),
    name: squad.formation,
    requiredGoalkeepers: 2,
    totalSlots: squad.snapshot.picks.length,
  };
};

const SavedSquadPreview = ({ squad }: { squad: SavedSquad }) => {
  const formation = useMemo(() => buildFormationForSavedSquad(squad), [squad]);
  const slots = useMemo(() => getLayoutForFormation(formation), [formation]);
  const picksBySlot = useMemo(() => {
    return new Map(squad.snapshot.picks.map((pick) => [pick.slotNo, pick]));
  }, [squad.snapshot.picks]);
  const benchPicks = squad.snapshot.picks
    .filter((pick) => pick.slotNo > 11)
    .sort((first, second) => first.slotNo - second.slotNo);

  return (
    <section className="rounded-[8px] border border-white/10 bg-slate-950/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">
            Saved squad
          </p>
          <h2 className="mt-1 text-3xl font-black text-white">{squad.name}</h2>
        </div>
        <div className="flex gap-2">
          <div className="rounded-[8px] bg-yellow-200 px-4 py-2 text-center text-slate-950">
            <div className="text-2xl font-black">{squad.rating}</div>
            <div className="text-[10px] font-black uppercase">rating</div>
          </div>
          <div className="rounded-[8px] bg-cyan-200 px-4 py-2 text-center text-slate-950">
            <div className="text-2xl font-black">{squad.chemistry}</div>
            <div className="text-[10px] font-black uppercase">chem</div>
          </div>
        </div>
      </div>

      <div
        className="relative mt-5 min-h-[620px] overflow-hidden rounded-[8px] border border-emerald-300/20 bg-emerald-950"
        style={{
          backgroundImage: `linear-gradient(rgba(2,6,23,0.68),rgba(2,6,23,0.88)), url(${stadiumBackground})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        {slots.map((slot) => {
          const pick = picksBySlot.get(slot.slotNo);

          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              key={slot.slotNo}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              {pick ? (
                <MiniPickedCard card={pick.playerCard} />
              ) : (
                <div className="grid h-[122px] w-[92px] place-items-center rounded-[8px] border border-cyan-200/50 bg-cyan-300/45 text-sm font-black text-slate-950">
                  {slot.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/55">
          Запасные
        </h3>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {benchPicks.map((pick: SavedSquadPick) => (
            <div key={pick.slotNo}>
              <MiniPickedCard card={pick.playerCard} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LineupsPage = () => {
  const savedSquads = useSavedSquadsStore((state) => state.savedSquads);
  const status = useSavedSquadsStore((state) => state.status);
  const error = useSavedSquadsStore((state) => state.error);
  const clearSavedSquads = useSavedSquadsStore(
    (state) => state.clearSavedSquads,
  );
  const deleteSavedSquad = useSavedSquadsStore(
    (state) => state.deleteSavedSquad,
  );
  const loadSavedSquads = useSavedSquadsStore((state) => state.loadSavedSquads);
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const selectedSquad =
    savedSquads.find((squad) => squad.id === selectedSquadId) ??
    savedSquads[0] ??
    null;
  const isDeleting = status === "deleting";

  useEffect(() => {
    void loadSavedSquads();
  }, [loadSavedSquads]);

  const handleDeleteSquad = (squad: SavedSquad) => {
    if (isDeleting || !window.confirm(`Удалить состав "${squad.name}"?`)) {
      return;
    }

    void (async () => {
      try {
        await deleteSavedSquad(squad.id);

        if (selectedSquadId === squad.id) {
          setSelectedSquadId(null);
        }
      } catch {
        // Store already exposes the request error in the page.
      }
    })();
  };

  const handleClearSquads = () => {
    if (
      isDeleting ||
      savedSquads.length === 0 ||
      !window.confirm("Удалить все сохранённые составы?")
    ) {
      return;
    }

    void (async () => {
      try {
        await clearSavedSquads();
        setSelectedSquadId(null);
      } catch {
        // Store already exposes the request error in the page.
      }
    })();
  };

  if (status === "loading" && savedSquads.length === 0) {
    return <Loader fullScreen />;
  }

  return (
    <main
      className="min-h-screen bg-[#07110f] px-4 py-8 text-white"
      data-testid="lineups-page"
    >
      <div className="mx-auto mb-4 w-full max-w-7xl">
        <Link
          className="inline-flex h-10 items-center rounded-[8px] border border-white/15 px-4 text-sm font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-lime-300/60 hover:text-white"
          to={RoutePath.main}
        >
          Назад
        </Link>
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[22rem_1fr]">
        <aside className="rounded-[8px] border border-white/10 bg-slate-950/92 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                My squads
              </p>
              <h1 className="mt-2 text-3xl font-black">Составы</h1>
            </div>
            <button
              className="h-9 rounded-[8px] border border-red-300/35 px-3 text-xs font-black uppercase text-red-100 transition hover:border-red-300 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={savedSquads.length === 0 || isDeleting}
              onClick={handleClearSquads}
              type="button"
            >
              Очистить
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-[8px] border border-red-400/40 bg-red-950/60 px-3 py-2 text-sm font-bold text-red-100">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            {savedSquads.map((squad) => (
              <SavedSquadCard
                isSelected={selectedSquad?.id === squad.id}
                key={squad.id}
                onClick={() => setSelectedSquadId(squad.id)}
                onDelete={() => handleDeleteSquad(squad)}
                squad={squad}
              />
            ))}
          </div>
        </aside>

        {selectedSquad ? (
          <div data-testid="saved-squad-preview">
            <SavedSquadPreview squad={selectedSquad} />
          </div>
        ) : (
          <section className="grid min-h-[32rem] place-items-center rounded-[8px] border border-white/10 bg-slate-950/90 p-8 text-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">
                Empty
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Сохранённых составов пока нет
              </h2>
              <p className="mt-3 max-w-xl text-sm font-bold text-white/55">
                Закончи драфт и нажми "Сохранить состав", тогда он появится
                здесь как отдельная read-only плашка.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default LineupsPage;
