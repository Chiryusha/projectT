import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type {
  TeamMatchStats,
  TournamentMatch,
  TournamentStage,
} from "@/features/draft";
import { useAuthStore } from "@/features/auth";
import { useDraftStore } from "@/features/draft";
import { useGameSettingsStore } from "@/features/settings";
import { MATCH_SPEED_DURATIONS } from "@/shared/config/gameSettings";
import introImage from "@/shared/assets/intro.png";
import stadiumImage from "@/shared/assets/first-page.jpg";
import { Loader, RoutePath } from "@/shared";

import "./TournamentPage.scss";

const stageLabels: Record<TournamentStage, string> = {
  FINAL: "Финал",
  QUARTERFINAL: "1/4 финала",
  SEMIFINAL: "1/2 финала",
};

const stageOrder: Record<TournamentStage, number> = {
  QUARTERFINAL: 0,
  SEMIFINAL: 1,
  FINAL: 2,
};

const stages: TournamentStage[] = ["QUARTERFINAL", "SEMIFINAL", "FINAL"];

type TournamentPhase = "bracket" | "match" | "summary";

type TournamentProgress = {
  completedUserMatches: number;
  elapsedMs: number;
  phase: TournamentPhase;
  tournamentId: string | null;
};

const statLabels: Array<[keyof TeamMatchStats, string]> = [
  ["possession", "Владение"],
  ["shots", "Удары"],
  ["shotsOnTarget", "В створ"],
  ["expectedGoals", "xG"],
  ["corners", "Угловые"],
  ["fouls", "Фолы"],
  ["yellowCards", "ЖК"],
  ["redCards", "КК"],
  ["missedPenalties", "Незаб. пен."],
];

const getLiveScore = (match: TournamentMatch, minute: number) => {
  const visibleGoals = match.events.filter(
    (event) => event.type === "GOAL" && event.minute <= minute,
  );

  return {
    away: visibleGoals.filter((event) => event.team === "AWAY").length,
    home: visibleGoals.filter((event) => event.team === "HOME").length,
  };
};

const getVisibleEventCount = (
  match: TournamentMatch,
  minute: number,
  team: "HOME" | "AWAY",
  type: TournamentMatch["events"][number]["type"],
) => {
  return match.events.filter(
    (event) =>
      event.team === team && event.type === type && event.minute <= minute,
  ).length;
};

const scaleStatValue = (value: number, progress: number) => {
  return Math.floor(value * progress);
};

const getLiveStats = (
  match: TournamentMatch,
  minute: number,
  isComplete: boolean,
) => {
  const stats = match.stats;

  if (!stats) {
    return null;
  }

  if (isComplete) {
    return stats;
  }

  const progress = Math.min(1, Math.max(0, minute / 90));
  const homePossession = Math.round(
    50 + (stats.home.possession - 50) * progress,
  );
  const awayPossession = 100 - homePossession;
  const homeShots = scaleStatValue(stats.home.shots, progress);
  const awayShots = scaleStatValue(stats.away.shots, progress);

  return {
    away: {
      corners: scaleStatValue(stats.away.corners, progress),
      expectedGoals: Number(
        (stats.away.expectedGoals * progress).toFixed(1),
      ),
      fouls: scaleStatValue(stats.away.fouls, progress),
      missedPenalties: getVisibleEventCount(
        match,
        minute,
        "AWAY",
        "MISSED_PENALTY",
      ),
      possession: awayPossession,
      redCards: getVisibleEventCount(match, minute, "AWAY", "RED_CARD"),
      shots: awayShots,
      shotsOnTarget: Math.min(
        awayShots,
        scaleStatValue(stats.away.shotsOnTarget, progress),
      ),
      yellowCards: scaleStatValue(stats.away.yellowCards, progress),
    },
    home: {
      corners: scaleStatValue(stats.home.corners, progress),
      expectedGoals: Number(
        (stats.home.expectedGoals * progress).toFixed(1),
      ),
      fouls: scaleStatValue(stats.home.fouls, progress),
      missedPenalties: getVisibleEventCount(
        match,
        minute,
        "HOME",
        "MISSED_PENALTY",
      ),
      possession: homePossession,
      redCards: getVisibleEventCount(match, minute, "HOME", "RED_CARD"),
      shots: homeShots,
      shotsOnTarget: Math.min(
        homeShots,
        scaleStatValue(stats.home.shotsOnTarget, progress),
      ),
      yellowCards: scaleStatValue(stats.home.yellowCards, progress),
    },
  };
};

const getEventLabel = (type: TournamentMatch["events"][number]["type"]) => {
  if (type === "GOAL") {
    return "Гол";
  }

  if (type === "MISSED_PENALTY") {
    return "Пенальти мимо";
  }

  return "Красная";
};

const getHiddenTeamName = (stage: TournamentStage) => {
  if (stage === "SEMIFINAL") {
    return "Победитель 1/4";
  }

  if (stage === "FINAL") {
    return "Победитель 1/2";
  }

  return "Соперник";
};

const isUserWinner = (match: TournamentMatch, userTeamName: string) => {
  return match.winnerTeamName === userTeamName;
};

const createInitialProgress = (tournamentId: string | null): TournamentProgress => ({
  completedUserMatches: 0,
  elapsedMs: 0,
  phase: "bracket",
  tournamentId,
});

const TeamPanel = ({
  image,
  lineup,
  name,
  side,
  strength,
}: {
  image: string;
  lineup: string[];
  name: string;
  side: "left" | "right";
  strength: number;
}) => {
  return (
    <aside className="tournament-team">
      <div
        className="tournament-team__image"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="tournament-team__body">
        <p className="tournament-team__side">{side === "left" ? "Home" : "Away"}</p>
        <h2>{name}</h2>
        <div className="tournament-team__strength">{strength}</div>
        <ol className="tournament-team__lineup">
          {lineup.map((player) => (
            <li key={player}>{player}</li>
          ))}
        </ol>
      </div>
    </aside>
  );
};

const MatchView = ({
  elapsedMs,
  matchDurationMs,
  match,
  onFinish,
  userAvatarUrl,
  userTeamName,
}: {
  elapsedMs: number;
  matchDurationMs: number;
  match: TournamentMatch;
  onFinish: () => void;
  userAvatarUrl: string | null;
  userTeamName: string;
}) => {
  const minute = Math.min(90, Math.floor((elapsedMs / matchDurationMs) * 90));
  const isComplete = elapsedMs >= matchDurationMs;
  const score = isComplete
    ? { away: match.awayScore, home: match.homeScore }
    : getLiveScore(match, minute);
  const visibleEvents = match.events.filter((event) => event.minute <= minute);
  const stats = getLiveStats(match, minute, isComplete);
  const userTeamImage = userAvatarUrl ?? introImage;
  const homeImage =
    match.homeTeamName === userTeamName ? userTeamImage : stadiumImage;
  const awayImage =
    match.awayTeamName === userTeamName ? userTeamImage : stadiumImage;

  return (
    <main className="tournament-page tournament-page--match" data-testid="match-page">
      <TeamPanel
        image={homeImage}
        lineup={match.homeLineup}
        name={match.homeTeamName}
        side="left"
        strength={match.homeStrength}
      />

      <section className="tournament-match">
        <div className="tournament-match__top">
          <p>{stageLabels[match.stage]}</p>
          <div className="tournament-match__clock">{minute}'</div>
        </div>

        <div className="tournament-match__score">
          <span>{score.home}</span>
          <strong>:</strong>
          <span>{score.away}</span>
        </div>

        <div className="tournament-match__names">
          <span>{match.homeTeamName}</span>
          <span>{match.awayTeamName}</span>
        </div>

        {stats ? (
          <div className="tournament-stats">
            {statLabels.map(([key, label]) => (
              <div className="tournament-stats__row" key={key}>
                <span>{stats.home[key]}</span>
                <strong>{label}</strong>
                <span>{stats.away[key]}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="tournament-events">
          {visibleEvents.length === 0 ? (
            <div className="tournament-events__empty">
              Матч начинается спокойно
            </div>
          ) : (
            visibleEvents.map((event, index) => (
              <div className="tournament-events__item" key={`${event.minute}-${index}`}>
                <span>{event.minute}'</span>
                <strong>{getEventLabel(event.type)}</strong>
                <p>{event.description}</p>
              </div>
            ))
          )}
        </div>

        {isComplete ? (
          <button className="tournament-match__next" onClick={onFinish} type="button">
            Далее
          </button>
        ) : null}
      </section>

      <TeamPanel
        image={awayImage}
        lineup={match.awayLineup}
        name={match.awayTeamName}
        side="right"
        strength={match.awayStrength}
      />
    </main>
  );
};

const TournamentPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const tournament = useDraftStore((state) => state.tournament);
  const sessionState = useDraftStore((state) => state.sessionState);
  const status = useDraftStore((state) => state.status);
  const error = useDraftStore((state) => state.error);
  const loadTournament = useDraftStore((state) => state.loadTournament);
  const startTournament = useDraftStore((state) => state.startTournament);
  const userAvatarUrl = useAuthStore((state) => state.user?.avatarUrl ?? null);
  const aiDifficulty = useGameSettingsStore((state) => state.aiDifficulty);
  const matchSpeed = useGameSettingsStore((state) => state.matchSpeed);
  const matchDurationMs = MATCH_SPEED_DURATIONS[matchSpeed];
  const tournamentId = tournament?.tournament.id ?? null;
  const [progress, setProgress] = useState<TournamentProgress>(() =>
    createInitialProgress(null),
  );
  const currentProgress =
    progress.tournamentId === tournamentId
      ? progress
      : createInitialProgress(tournamentId);
  const { completedUserMatches, elapsedMs, phase } = currentProgress;

  useEffect(() => {
    if (!sessionId || tournament?.tournament.sessionId === sessionId || status === "loading") {
      return;
    }

    void loadTournament(sessionId);
  }, [loadTournament, sessionId, status, tournament?.tournament.sessionId]);

  useEffect(() => {
    if (phase !== "match") {
      return;
    }

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const nextElapsedMs = Math.min(Date.now() - startedAt, matchDurationMs);
      setProgress((storedProgress) => {
        if (
          storedProgress.tournamentId !== tournamentId ||
          storedProgress.phase !== "match"
        ) {
          return storedProgress;
        }

        return { ...storedProgress, elapsedMs: nextElapsedMs };
      });
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [matchDurationMs, phase, tournamentId]);

  const userTeamName = tournament?.tournament.userTeamName ?? "User Squad";
  const userMatches = useMemo(() => {
    return tournament?.matches.filter((match) => match.isUserMatch) ?? [];
  }, [tournament?.matches]);
  const activeMatch = userMatches[completedUserMatches] ?? null;
  const previousMatch = userMatches[completedUserMatches - 1] ?? null;
  const userFinishedTournament =
    userMatches.length > 0 && completedUserMatches >= userMatches.length;
  const visibleStageIndex = activeMatch
    ? stageOrder[activeMatch.stage]
    : userFinishedTournament
      ? Number.POSITIVE_INFINITY
      : stageOrder.QUARTERFINAL;
  const visibleTournamentStatus = userFinishedTournament
    ? tournament?.userJourney.isChampion
      ? "Чемпион"
      : "Выбыл"
    : "В процессе";

  const startNextMatch = () => {
    setProgress((storedProgress) => {
      const baseProgress =
        storedProgress.tournamentId === tournamentId
          ? storedProgress
          : createInitialProgress(tournamentId);

      return { ...baseProgress, elapsedMs: 0, phase: "match" };
    });
  };

  const finishMatch = () => {
    setProgress((storedProgress) => {
      const baseProgress =
        storedProgress.tournamentId === tournamentId
          ? storedProgress
          : createInitialProgress(tournamentId);

      return { ...baseProgress, phase: "summary" };
    });
  };

  const continueAfterSummary = () => {
    if (!activeMatch) {
      return;
    }

    setProgress((storedProgress) => {
      const baseProgress =
        storedProgress.tournamentId === tournamentId
          ? storedProgress
          : createInitialProgress(tournamentId);

      return {
        ...baseProgress,
        completedUserMatches: baseProgress.completedUserMatches + 1,
        phase: "bracket",
      };
    });
  };

  if (status === "loading" || status === "starting-tournament") {
    return <Loader fullScreen />;
  }

  if (!tournament) {
    const isCurrentSessionTournamentStarted = Boolean(
      sessionState &&
        (!sessionId || sessionState.session.id === sessionId) &&
        sessionState.session.tournamentId,
    );
    const canStartFromDraft =
      sessionState?.session.status === "COMPLETED" &&
      !isCurrentSessionTournamentStarted;

    return (
    <main className="tournament-page tournament-page--empty" data-testid="tournament-empty">
        <section>
          <h1>Турнир еще не начат</h1>
          <p>
            Сначала собери драфт до конца, а потом запускай турнир.
          </p>
          {error ? <strong>{error}</strong> : null}
          <div>
            {sessionState?.session.status === "COMPLETED" ? (
              <button
                disabled={!canStartFromDraft}
                onClick={() => {
                  void startTournament(aiDifficulty);
                }}
                title={
                  isCurrentSessionTournamentStarted
                    ? "Турнир уже сыгран"
                    : undefined
                }
                type="button"
              >
                {isCurrentSessionTournamentStarted
                  ? "Турнир уже сыгран"
                  : "Запустить турнир"}
              </button>
            ) : null}
            <Link to={RoutePath.draft}>Вернуться к драфту</Link>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "match" && activeMatch) {
    return (
      <MatchView
        elapsedMs={elapsedMs}
        matchDurationMs={matchDurationMs}
        match={activeMatch}
        onFinish={finishMatch}
        userAvatarUrl={userAvatarUrl}
        userTeamName={userTeamName}
      />
    );
  }

  if (phase === "summary") {
    const summaryMatch = activeMatch ?? previousMatch;
    const userWon = summaryMatch
      ? isUserWinner(summaryMatch, userTeamName)
      : tournament.userJourney.isChampion;
    const hasNextMatch = userWon && completedUserMatches + 1 < userMatches.length;

    return (
      <main className="tournament-page tournament-page--summary" data-testid="tournament-summary">
        <section className="tournament-summary">
          <p>{summaryMatch ? stageLabels[summaryMatch.stage] : "Турнир"}</p>
          <h1>
            {userWon
              ? hasNextMatch
                ? "Победа. Идем дальше"
                : "Ты чемпион турнира"
              : "Команда выбыла"}
          </h1>
          {summaryMatch ? (
            <div className="tournament-summary__score">
              {summaryMatch.homeTeamName} {summaryMatch.homeScore}:{summaryMatch.awayScore}{" "}
              {summaryMatch.awayTeamName}
            </div>
          ) : null}
          <button onClick={continueAfterSummary} type="button">
            {hasNextMatch ? "Далее к сетке" : "Показать сетку"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="tournament-page tournament-page--bracket" data-testid="tournament-bracket">
      <section className="tournament-bracket">
        <div className="tournament-bracket__header">
          <div>
            <p>Draft Tournament</p>
            <h1>Турнирная сетка</h1>
          </div>
          <div className="tournament-bracket__status">
            {visibleTournamentStatus}
          </div>
        </div>

        <div className="tournament-bracket__grid">
          {stages.map((stage) => (
            <div className="tournament-bracket__stage" key={stage}>
              <h2>{stageLabels[stage]}</h2>
              {tournament.matches
                .filter((match) => match.stage === stage)
                .map((match) => {
                  const matchStageIndex = stageOrder[match.stage];
                  const userMatchIndex = userMatches.findIndex(
                    (userMatch) => userMatch.id === match.id,
                  );
                  const isNextUserMatch = activeMatch?.id === match.id;
                  const isPlayedUserMatch =
                    userMatchIndex >= 0 && userMatchIndex < completedUserMatches;
                  const canShowTeamNames = matchStageIndex <= visibleStageIndex;
                  const canShowScore =
                    userFinishedTournament ||
                    isPlayedUserMatch ||
                    matchStageIndex < visibleStageIndex;
                  const hiddenTeamName = getHiddenTeamName(match.stage);
                  const className = [
                    "tournament-bracket__match",
                    isNextUserMatch ? "tournament-bracket__match--active" : "",
                    canShowTeamNames ? "" : "tournament-bracket__match--locked",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <article className={className} key={match.id}>
                      <div>
                        <span>{canShowTeamNames ? match.homeTeamName : hiddenTeamName}</span>
                        <strong>{canShowScore ? match.homeScore : "?"}</strong>
                      </div>
                      <div>
                        <span>{canShowTeamNames ? match.awayTeamName : hiddenTeamName}</span>
                        <strong>{canShowScore ? match.awayScore : "?"}</strong>
                      </div>
                    </article>
                  );
                })}
            </div>
          ))}
        </div>

        <div className="tournament-bracket__actions">
          {activeMatch ? (
            <button
              data-testid="tournament-start-match"
              onClick={startNextMatch}
              type="button"
            >
              {completedUserMatches === 0
                ? "Начать первый матч"
                : "Играть следующий матч"}
            </button>
          ) : (
            <Link to={RoutePath.draft}>Вернуться к драфту</Link>
          )}
        </div>
      </section>
    </main>
  );
};

export default TournamentPage;
