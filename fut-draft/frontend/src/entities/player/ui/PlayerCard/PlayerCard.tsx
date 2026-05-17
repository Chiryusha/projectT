import { getCardInitials, resolvePlayerImageUrl } from "../../lib/playerCard";
import type { DraftPlayerCard } from "../../model/types";

type PlayerCardProps = {
  card: DraftPlayerCard;
  disabled?: boolean;
  onSelect?: (cardId: string) => void;
};

const PlayerCard = ({ card, disabled = false, onSelect }: PlayerCardProps) => {
  const imageUrl = resolvePlayerImageUrl(card.player.imageUrl);

  const content = (
    <div className="relative flex h-full min-h-[160px] flex-col overflow-hidden rounded-[8px] border border-yellow-200/70 bg-[linear-gradient(135deg,#f8e8a4,#d6a83e)] p-3 text-[#251c0a] shadow-[0_16px_30px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-x-2 top-2 h-10 rounded-full bg-white/25 blur-xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-3xl font-black leading-none">{card.overall}</div>
          <div className="text-sm font-black uppercase">{card.basePosition}</div>
        </div>
        <div className="rounded-[6px] bg-black/15 px-2 py-1 text-[10px] font-black uppercase">
          {card.rarity}
        </div>
      </div>
      <div className="relative my-3 grid flex-1 place-items-center rounded-[8px] bg-black/10">
        {imageUrl ? (
          <img
            alt={card.player.fullName}
            className="h-24 w-full object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.35)]"
            loading="lazy"
            src={imageUrl}
          />
        ) : (
          <span className="text-4xl font-black text-white/80 drop-shadow">
            {getCardInitials(card.player.fullName)}
          </span>
        )}
      </div>
      <div className="relative min-w-0">
        <div className="truncate text-center text-sm font-black uppercase">
          {card.player.fullName}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-bold uppercase">
          <span className="truncate rounded-[6px] bg-white/28 px-2 py-1">
            {card.player.nation}
          </span>
          <span className="truncate rounded-[6px] bg-white/28 px-2 py-1 text-right">
            {card.player.club}
          </span>
        </div>
      </div>
    </div>
  );

  if (!onSelect) {
    return content;
  }

  return (
    <button
      className="block w-full transition hover:-translate-y-1 hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
      disabled={disabled}
      onClick={() => onSelect(card.id)}
      type="button"
    >
      {content}
    </button>
  );
};

export default PlayerCard;
