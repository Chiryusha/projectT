import type { DraftFormation } from "../model/types";

type SlotPoint = {
  slotNo: number;
  x: number;
  y: number;
};

export type SquadSlot = SlotPoint & {
  label: string;
};

const SLOT_LAYOUTS: Record<string, SlotPoint[]> = {
  "4-3-3": [
    { slotNo: 1, x: 50, y: 88 },
    { slotNo: 2, x: 80, y: 73 },
    { slotNo: 3, x: 62, y: 74 },
    { slotNo: 4, x: 38, y: 74 },
    { slotNo: 5, x: 20, y: 73 },
    { slotNo: 6, x: 32, y: 48 },
    { slotNo: 7, x: 50, y: 49 },
    { slotNo: 8, x: 68, y: 48 },
    { slotNo: 9, x: 75, y: 22 },
    { slotNo: 10, x: 50, y: 17 },
    { slotNo: 11, x: 25, y: 22 },
  ],
  "4-4-2": [
    { slotNo: 1, x: 50, y: 88 },
    { slotNo: 2, x: 80, y: 74 },
    { slotNo: 3, x: 62, y: 74 },
    { slotNo: 4, x: 38, y: 74 },
    { slotNo: 5, x: 20, y: 74 },
    { slotNo: 6, x: 77, y: 47 },
    { slotNo: 7, x: 58, y: 49 },
    { slotNo: 8, x: 42, y: 49 },
    { slotNo: 9, x: 23, y: 47 },
    { slotNo: 10, x: 43, y: 18 },
    { slotNo: 11, x: 57, y: 18 },
  ],
  "3-5-2": [
    { slotNo: 1, x: 50, y: 88 },
    { slotNo: 2, x: 66, y: 68 },
    { slotNo: 3, x: 50, y: 64 },
    { slotNo: 4, x: 34, y: 68 },
    { slotNo: 5, x: 80, y: 50 },
    { slotNo: 6, x: 62, y: 47 },
    { slotNo: 7, x: 38, y: 47 },
    { slotNo: 8, x: 50, y: 34 },
    { slotNo: 9, x: 20, y: 50 },
    { slotNo: 10, x: 43, y: 18 },
    { slotNo: 11, x: 57, y: 18 },
  ],
  "4-2-3-1": [
    { slotNo: 1, x: 50, y: 88 },
    { slotNo: 2, x: 80, y: 76 },
    { slotNo: 3, x: 64, y: 77 },
    { slotNo: 4, x: 36, y: 77 },
    { slotNo: 5, x: 20, y: 76 },
    { slotNo: 6, x: 40, y: 56 },
    { slotNo: 7, x: 60, y: 56 },
    { slotNo: 8, x: 75, y: 36 },
    { slotNo: 9, x: 50, y: 43 },
    { slotNo: 10, x: 25, y: 36 },
    { slotNo: 11, x: 50, y: 17 },
  ],
  "5-3-2": [
    { slotNo: 1, x: 50, y: 88 },
    { slotNo: 2, x: 80, y: 61 },
    { slotNo: 3, x: 66, y: 69 },
    { slotNo: 4, x: 50, y: 64 },
    { slotNo: 5, x: 34, y: 69 },
    { slotNo: 6, x: 20, y: 61 },
    { slotNo: 7, x: 35, y: 45 },
    { slotNo: 8, x: 50, y: 40 },
    { slotNo: 9, x: 65, y: 45 },
    { slotNo: 10, x: 43, y: 18 },
    { slotNo: 11, x: 57, y: 18 },
  ],
};

export const getLayoutForFormation = (
  formation: DraftFormation,
): SquadSlot[] => {
  const layout = SLOT_LAYOUTS[formation.code] ?? SLOT_LAYOUTS["4-3-3"];

  return layout.map((point) => ({
    ...point,
    label: formation.lineupSlots[point.slotNo - 1] ?? "ANY",
  }));
};
