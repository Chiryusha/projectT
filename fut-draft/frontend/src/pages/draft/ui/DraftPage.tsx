import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FormationSelection,
  SquadBoard,
  TournamentResult,
  useDraftStore,
} from "@/features/draft";
import { useSavedSquadsStore } from "@/features/savedSquads";
import { useGameSettingsStore } from "@/features/settings";
import { Loader, RoutePath } from "@/shared";

const formatSavedSquadDate = () => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
};

const buildSavedSquadName = (name: string, formation: string) => {
  const baseName = name.trim() || `${formation} squad`;

  return `${baseName} · ${formatSavedSquadDate()}`;
};

const DraftPage = () => {
  const navigate = useNavigate();
  const formations = useDraftStore((state) => state.formations);
  const selectedFormationCode = useDraftStore(
    (state) => state.selectedFormationCode,
  );
  const sessionState = useDraftStore((state) => state.sessionState);
  const tournament = useDraftStore((state) => state.tournament);
  const status = useDraftStore((state) => state.status);
  const error = useDraftStore((state) => state.error);
  const loadFormations = useDraftStore((state) => state.loadFormations);
  const selectFormation = useDraftStore((state) => state.selectFormation);
  const createSession = useDraftStore((state) => state.createSession);
  const loadSlotOptions = useDraftStore((state) => state.loadSlotOptions);
  const pickPlayer = useDraftStore((state) => state.pickPlayer);
  const swapPicks = useDraftStore((state) => state.swapPicks);
  const startTournament = useDraftStore((state) => state.startTournament);
  const resetDraft = useDraftStore((state) => state.resetDraft);
  const clearError = useDraftStore((state) => state.clearError);
  const savedSquads = useSavedSquadsStore((state) => state.savedSquads);
  const savedSquadsStatus = useSavedSquadsStore((state) => state.status);
  const savedSquadsError = useSavedSquadsStore((state) => state.error);
  const saveCurrentSquad = useSavedSquadsStore((state) => state.saveCurrentSquad);
  const aiDifficulty = useGameSettingsStore((state) => state.aiDifficulty);
  const [openedPickSlotNo, setOpenedPickSlotNo] = useState<number | null>(null);
  const [selectedSwapSlotNo, setSelectedSwapSlotNo] = useState<number | null>(
    null,
  );
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [squadName, setSquadName] = useState("");

  useEffect(() => {
    void loadFormations();
  }, [loadFormations]);

  const selectedFormation =
    formations.find((formation) => formation.code === selectedFormationCode) ??
    formations[0] ??
    null;
  const activeFormation =
    formations.find(
      (formation) => formation.code === sessionState?.session.formation,
    ) ?? selectedFormation;
  const isPicking = status === "picking";
  const isLoadingOptions = status === "loading-options";
  const isSwapping = status === "swapping";
  const isStartingTournament = status === "starting-tournament";
  const isSavingSquad = savedSquadsStatus === "saving";
  const isTournamentStarted = Boolean(
    sessionState &&
      (sessionState.session.tournamentId ||
        tournament?.tournament.sessionId === sessionState.session.id),
  );
  const canStartTournament =
    sessionState?.session.status === "COMPLETED" &&
    !isTournamentStarted &&
    !isStartingTournament &&
    !isSwapping &&
    !isPicking &&
    !isLoadingOptions;
  const isCurrentSquadSaved = Boolean(
    sessionState &&
      savedSquads.some((squad) => squad.sessionId === sessionState.session.id),
  );
  const canSaveSquad =
    sessionState?.session.status === "COMPLETED" &&
    !isCurrentSquadSaved &&
    !isSavingSquad &&
    !isSwapping &&
    !isPicking &&
    !isLoadingOptions;

  const handleSlotClick = (slotNo: number, isFilled: boolean) => {
    if (!sessionState || isPicking || isSwapping || isLoadingOptions) {
      return;
    }

    clearError();

    if (isFilled) {
      setOpenedPickSlotNo(null);

      if (selectedSwapSlotNo === null) {
        setSelectedSwapSlotNo(slotNo);

        return;
      }

      if (selectedSwapSlotNo === slotNo) {
        setSelectedSwapSlotNo(null);

        return;
      }

      const sourceSlotNo = selectedSwapSlotNo;
      setSelectedSwapSlotNo(null);
      void swapPicks(sourceSlotNo, slotNo);

      return;
    }

    setSelectedSwapSlotNo(null);

    if (sessionState.session.status !== "IN_PROGRESS") {
      setOpenedPickSlotNo(null);

      return;
    }

    setOpenedPickSlotNo(slotNo);
    void loadSlotOptions(slotNo);
  };

  const handlePickPlayer = (cardId: string) => {
    void (async () => {
      if (openedPickSlotNo === null) {
        return;
      }

      await pickPlayer(cardId, openedPickSlotNo);
      setOpenedPickSlotNo(null);
    })();
  };

  const handleSaveSquad = () => {
    void (async () => {
      if (!sessionState) {
        return;
      }

      try {
        await saveCurrentSquad(
          sessionState.session.id,
          buildSavedSquadName(squadName, sessionState.session.formation),
        );
        setSquadName("");
        setIsSaveDialogOpen(false);
      } catch {
        // Store already exposes the request error on the page.
      }
    })();
  };

  if (status === "loading" && formations.length === 0) {
    return <Loader fullScreen />;
  }

  if (!sessionState) {
    return (
      <>
        <FormationSelection
          formations={formations}
          onCreate={() => {
            clearError();
            void createSession();
          }}
          onSelect={selectFormation}
          selectedFormation={selectedFormation}
          status={status}
        />
        {error ? (
          <div className="fixed bottom-5 left-1/2 z-50 w-[min(520px,calc(100%-2rem))] -translate-x-1/2 rounded-[8px] border border-red-400/50 bg-red-950 px-4 py-3 text-sm font-bold text-red-100 shadow-2xl">
            {error}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b12] px-3 py-4 text-white sm:px-5">
      <div className="mx-auto flex w-full max-w-none flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-slate-950/92 px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
              FUT Draft
            </p>
            <h1 className="mt-1 text-2xl font-black">
              {sessionState.session.formation}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="mr-5 h-10 rounded-[8px] border border-white/15 px-4 text-sm font-black uppercase text-white/70 transition hover:border-white/35 hover:text-white"
              onClick={() => {
                setOpenedPickSlotNo(null);
                setSelectedSwapSlotNo(null);
                resetDraft();
              }}
              type="button"
            >
              Новая схема
            </button>
            <button
              className="h-10 rounded-[8px] border border-cyan-200/45 px-4 text-sm font-black uppercase text-cyan-100 transition hover:border-cyan-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="save-squad-open"
              disabled={!canSaveSquad}
              onClick={() => {
                setIsSaveDialogOpen(true);
              }}
              type="button"
            >
              {isSavingSquad
                ? "Сохраняем..."
                : isCurrentSquadSaved
                  ? "Состав сохранен"
                  : "Сохранить состав"}
            </button>
            <button
              className="h-10 rounded-[8px] bg-lime-300 px-4 text-sm font-black uppercase text-slate-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="start-tournament"
              disabled={!canStartTournament}
              title={isTournamentStarted ? "Турнир уже сыгран" : undefined}
              onClick={() => {
                void (async () => {
                  const nextTournament = await startTournament(aiDifficulty);
                  navigate(
                    `${RoutePath.tournament}?sessionId=${nextTournament.tournament.sessionId}`,
                  );
                })();
              }}
              type="button"
            >
              {isTournamentStarted
                ? "Турнир уже сыгран"
                : isStartingTournament
                  ? "Симуляция..."
                  : "Начать турнир"}
            </button>
          </div>
        </header>

        {error || savedSquadsError ? (
          <div className="rounded-[8px] border border-red-400/50 bg-red-950/80 px-4 py-3 text-sm font-bold text-red-100">
            {error ?? savedSquadsError}
          </div>
        ) : null}

        {activeFormation ? (
          <SquadBoard
            formation={activeFormation}
            isLoadingOptions={isLoadingOptions}
            isPicking={isPicking}
            isSwapping={isSwapping}
            onClosePickDrawer={() => setOpenedPickSlotNo(null)}
            onPickPlayer={handlePickPlayer}
            onSlotClick={handleSlotClick}
            openedPickSlotNo={openedPickSlotNo}
            selectedSwapSlotNo={selectedSwapSlotNo}
            sessionState={sessionState}
          />
        ) : null}

        {tournament ? <TournamentResult tournament={tournament} /> : null}
      </div>

      {isSaveDialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-[8px] border border-white/10 bg-slate-950 p-5 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">
              Save squad
            </p>
            <h2 className="mt-2 text-2xl font-black">Название состава</h2>
            <p className="mt-2 text-sm font-bold text-white/55">
              К названию автоматически добавится сегодняшняя дата.
            </p>
            <input
              autoFocus
              className="mt-4 h-12 w-full rounded-[8px] border border-white/10 bg-black/35 px-4 text-base font-bold text-white outline-none transition placeholder:text-white/30 focus:border-lime-300"
              data-testid="save-squad-name"
              maxLength={32}
              onChange={(event) => setSquadName(event.target.value)}
              placeholder={`${sessionState.session.formation} squad`}
              value={squadName}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-10 rounded-[8px] border border-white/15 px-4 text-sm font-black uppercase text-white/65 transition hover:border-white/35 hover:text-white"
                disabled={isSavingSquad}
                onClick={() => {
                  setSquadName("");
                  setIsSaveDialogOpen(false);
                }}
                type="button"
              >
                Отмена
              </button>
              <button
                className="h-10 rounded-[8px] bg-lime-300 px-4 text-sm font-black uppercase text-slate-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="save-squad-submit"
                disabled={isSavingSquad}
                onClick={handleSaveSquad}
                type="button"
              >
                {isSavingSquad ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default DraftPage;
