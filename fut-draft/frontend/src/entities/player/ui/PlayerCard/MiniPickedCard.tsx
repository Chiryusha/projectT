import { getCardInitials, resolvePlayerImageUrl } from "../../lib/playerCard";
import type { DraftPlayerCard } from "../../model/types";

type MiniPickedCardProps = {
  card: DraftPlayerCard;
};

const MiniPickedCard = ({ card }: MiniPickedCardProps) => {
  const imageUrl = resolvePlayerImageUrl(card.player.imageUrl);

  return (
    <div className="h-[122px] w-[92px] rounded-[8px] border border-yellow-200/70 bg-[linear-gradient(135deg,#f8e8a4,#d6a83e)] p-2 text-[#251c0a] shadow-[0_12px_26px_rgba(0,0,0,0.38)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-black leading-none">{card.overall}</div>
          <div className="text-xs font-black">{card.basePosition}</div>
        </div>
        <div className="grid h-9 w-9 overflow-hidden rounded-full bg-black/12 text-xs font-black">
          {imageUrl ? (
            <img
              alt={card.player.fullName}
              className="h-full w-full object-cover"
              loading="lazy"
              src={imageUrl}
            />
          ) : (
            <span className="grid h-full w-full place-items-center">
              {getCardInitials(card.player.fullName)}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 truncate text-center text-xs font-black uppercase">
        {card.player.fullName}
      </div>
      <div className="mt-2 truncate text-center text-[10px] font-bold uppercase opacity-70">
        {card.player.club}
      </div>
    </div>
  );
};

export default MiniPickedCard;
