import type { TournamentResponse } from "../../model/types";

type TournamentResultProps = {
  tournament: TournamentResponse;
};

const TournamentResult = ({ tournament }: TournamentResultProps) => {
  return (
    <section className="rounded-[8px] border border-amber-300/35 bg-amber-300/10 p-5 text-white">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-200">
        Tournament result
      </p>
      <h2 className="mt-2 text-2xl font-black">
        {tournament.userJourney.isChampion
          ? "Ты чемпион драфта"
          : `Победитель: ${tournament.tournament.championTeam ?? "unknown"}`}
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {tournament.matches
          .filter((match) => match.isUserMatch)
          .map((match) => (
            <div className="rounded-[8px] bg-black/24 p-4" key={match.id}>
              <div className="text-xs font-black uppercase text-white/45">
                {match.stage}
              </div>
              <div className="mt-2 text-sm font-bold">
                {match.homeTeamName} {match.homeScore}:{match.awayScore}{" "}
                {match.awayTeamName}
              </div>
              <div className="mt-2 text-xs text-lime-200">
                Winner: {match.winnerTeamName}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

export default TournamentResult;
