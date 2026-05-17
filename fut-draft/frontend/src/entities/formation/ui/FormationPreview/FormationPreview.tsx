import { getLayoutForFormation } from "../../lib/formationLayout";
import type { DraftFormation } from "../../model/types";

type FormationPreviewProps = {
  formation: DraftFormation;
};

const FormationPreview = ({ formation }: FormationPreviewProps) => {
  const slots = getLayoutForFormation(formation);

  return (
    <div className="relative aspect-[16/11] min-h-[280px] w-full overflow-hidden rounded-[8px] border border-emerald-300/25 bg-emerald-950/65 shadow-inner">
      <div className="absolute inset-[6%] rounded-[8px] border border-emerald-200/25" />
      <div className="absolute left-1/2 top-[8%] h-[84%] w-px -translate-x-1/2 bg-emerald-200/15" />
      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/20" />
      {slots.map((slot) => {
        const previewY = Math.min(slot.y, 90);

        return (
          <div
            className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[8px] border border-cyan-100/60 bg-cyan-300/80 text-[10px] font-black text-emerald-950 shadow-[0_0_18px_rgba(103,232,249,0.35)]"
            key={slot.slotNo}
            style={{ left: `${slot.x}%`, top: `${previewY}%` }}
          >
            {slot.label}
          </div>
        );
      })}
    </div>
  );
};

export default FormationPreview;
