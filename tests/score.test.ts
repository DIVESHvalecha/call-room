import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { basePoints, totalPoints, tieBreak } from "../lib/score.ts";

describe("rarity scoring", () => {
  it("64% → 12", () => assert.equal(basePoints(64), 12));
  it("16% → 25", () => assert.equal(basePoints(16), 25));
  it("1% caps at 100", () => assert.equal(basePoints(1), 100));
  it("speed bonus +5 under 5s", () => assert.equal(totalPoints(64, 3000), 17));
  it("no bonus over 5s", () => assert.equal(totalPoints(64, 9000), 12));
  it("earlier wins ties", () => assert.ok(tieBreak(2000, 4000) < 0));
});
