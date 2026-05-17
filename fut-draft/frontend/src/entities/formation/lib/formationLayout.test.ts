import type { DraftFormation } from "../model/types";
import { getLayoutForFormation } from "./formationLayout";

const createFormation = (
  code: string,
  lineupSlots: string[] = ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"],
): DraftFormation => ({
  benchSlots: 7,
  code,
  lineupSlots,
  name: code,
  requiredGoalkeepers: 2,
  totalSlots: 18,
});

describe("getLayoutForFormation", () => {
  it("adds position labels to every slot from the selected formation", () => {
    const layout = getLayoutForFormation(createFormation("4-3-3"));

    expect(layout).toHaveLength(11);
    expect(layout[0]).toMatchObject({ label: "GK", slotNo: 1 });
    expect(layout[9]).toMatchObject({ label: "ST", slotNo: 10 });
    expect(layout[10]).toMatchObject({ label: "LW", slotNo: 11 });
  });

  it("falls back to the 4-3-3 coordinates for unknown formation codes", () => {
    const layout = getLayoutForFormation(createFormation("unknown"));

    expect(layout[0]).toMatchObject({ label: "GK", slotNo: 1, x: 50, y: 88 });
    expect(layout[10]).toMatchObject({ label: "LW", slotNo: 11, x: 25, y: 22 });
  });

  it("uses ANY when formation data has no label for a layout slot", () => {
    const layout = getLayoutForFormation(createFormation("4-3-3", ["GK"]));

    expect(layout[0]?.label).toBe("GK");
    expect(layout[1]?.label).toBe("ANY");
  });
});
