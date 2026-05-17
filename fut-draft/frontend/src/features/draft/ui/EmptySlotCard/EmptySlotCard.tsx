type EmptySlotCardProps = {
  label: string;
};

const EmptySlotCard = ({ label }: EmptySlotCardProps) => {
  return (
    <div className="grid h-[116px] w-[88px] place-items-center rounded-[8px] border-2 border-cyan-100/60 bg-cyan-300/65 text-center shadow-[0_12px_30px_rgba(34,211,238,0.24)]">
      <div>
        <div className="text-xs font-black uppercase text-cyan-950/60">FUT</div>
        <div className="mt-1 text-sm font-black text-cyan-950">{label}</div>
      </div>
    </div>
  );
};

export default EmptySlotCard;
