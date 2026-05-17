import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import {
  clamp,
  deterministicHash,
  normalizeName,
  readPositiveInt,
  toQueryValue,
} from "../../prisma/seed/utils";

describe("seed utils", () => {
  it("clamps values into the provided range", () => {
    assert.equal(clamp(120, 0, 99), 99);
    assert.equal(clamp(-5, 0, 99), 0);
    assert.equal(clamp(84, 0, 99), 84);
  });

  it("reads only positive integer env values", () => {
    assert.equal(readPositiveInt("6", 10), 6);
    assert.equal(readPositiveInt(undefined, 10), 10);
    assert.equal(readPositiveInt("abc", 10), 10);
    assert.equal(readPositiveInt("-1", 10), 10);
    assert.equal(readPositiveInt("1.5", 10), 10);
  });

  it("normalizes names for stable comparisons", () => {
    assert.equal(normalizeName("Ángel Di María"), "angeldimaria");
    assert.equal(normalizeName("A & B United"), "aandbunited");
    assert.equal(normalizeName("Real Madrid CF"), "realmadridcf");
  });

  it("prepares query values for TheSportsDB urls", () => {
    assert.equal(
      toQueryValue("English Premier League"),
      "English_Premier_League",
    );
    assert.equal(toQueryValue("  Paris SG  "), "Paris_SG");
  });

  it("creates deterministic hashes", () => {
    assert.equal(deterministicHash("MbappeST"), deterministicHash("MbappeST"));
    assert.notEqual(
      deterministicHash("MbappeST"),
      deterministicHash("MbappeLW"),
    );
  });
});
