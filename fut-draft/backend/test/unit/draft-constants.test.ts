import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import {
  FORMATIONS,
  getFormationByCode,
  getSlotPosition,
} from "../../src/draft/draft.constants";

describe("draft constants", () => {
  it("returns formations by code", () => {
    assert.equal(getFormationByCode("4-3-3")?.name, "4-3-3 Attack");
    assert.equal(getFormationByCode("missing"), undefined);
  });

  it("resolves lineup and bench slot positions", () => {
    assert.equal(getSlotPosition("4-3-3", 1), "GK");
    assert.equal(getSlotPosition("4-3-3", 11), "LW");
    assert.equal(getSlotPosition("4-3-3", 12), "ANY");
  });

  it("keeps every formation at eleven starters", () => {
    for (const formation of FORMATIONS) {
      assert.equal(formation.lineupSlots.length, 11, formation.code);
    }
  });
});
