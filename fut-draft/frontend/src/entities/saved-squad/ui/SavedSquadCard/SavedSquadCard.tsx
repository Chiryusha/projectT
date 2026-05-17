import type { SavedSquad } from "../../model/types";

type SavedSquadCardProps = {
  isSelected?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  squad: SavedSquad;
};

const formatSavedAt = (value: string) => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const SavedSquadCard = ({
  isSelected = false,
  onClick,
  onDelete,
  squad,
}: SavedSquadCardProps) => {
  return (
    <article
      className={
        isSelected
          ? "rounded-[8px] border border-lime-300 bg-lime-300/12 p-4 shadow-[0_0_26px_rgba(190,242,100,0.18)]"
          : "rounded-[8px] border border-white/10 bg-white/[0.045] p-4 transition hover:border-lime-300/60 hover:bg-white/[0.075]"
      }
      data-testid="saved-squad-card"
    >
      <button className="w-full text-left" onClick={onClick} type="button">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">
              {squad.formation}
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              {squad.name}
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
              {formatSavedAt(squad.createdAt)}
            </p>
          </div>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[8px] border border-yellow-200/40 bg-yellow-200 text-xl font-black text-slate-950">
            {squad.rating}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[8px] bg-black/25 p-3">
            <dt className="text-[11px] font-black uppercase text-white/45">
              Chemistry
            </dt>
            <dd className="mt-1 text-2xl font-black text-cyan-200">
              {squad.chemistry}
            </dd>
          </div>
          <div className="rounded-[8px] bg-black/25 p-3">
            <dt className="text-[11px] font-black uppercase text-white/45">
              Players
            </dt>
            <dd className="mt-1 text-2xl font-black text-white">
              {squad.snapshot.picks.length}
            </dd>
          </div>
        </div>
      </button>

      {onDelete ? (
        <button
          className="mt-3 h-9 w-full rounded-[8px] border border-red-300/35 text-xs font-black uppercase text-red-100 transition hover:border-red-300 hover:bg-red-400/15"
          onClick={onDelete}
          type="button"
        >
          Удалить
        </button>
      ) : null}
    </article>
  );
};

export default SavedSquadCard;
