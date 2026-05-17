import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import { TournamentStage } from "@prisma/client";

import { MatchSimulatorService } from "../../src/draft/match-simulator.service";

const createService = () => {
  return new MatchSimulatorService({
    get: (key: string) => {
      if (key === "AI_MATCH_SIMULATION_ENABLED") {
        return "false";
      }

      return undefined;
    },
  } as never);
};

describe("MatchSimulatorService", () => {
  it("simulates a local knockout match with a winner and consistent goal events", async () => {
    const service = createService();

    const result = await service.simulate({
      awayChemistry: 70,
      awayLineup: ["GK Away Keeper", "ST Away Striker"],
      awayStrength: 82,
      awayTeamName: "Away FC",
      homeChemistry: 88,
      homeLineup: ["GK Home Keeper", "ST Home Striker"],
      homeStrength: 88,
      homeTeamName: "Home FC",
      stage: TournamentStage.QUARTERFINAL,
    });

    assert.equal(result.provider, "local");
    assert.notEqual(result.homeScore, result.awayScore);
    assert.equal(
      result.winner,
      result.homeScore > result.awayScore ? "HOME" : "AWAY",
    );
    assert.equal(
      result.events.filter(
        (event) => event.type === "GOAL" && event.team === "HOME",
      ).length,
      result.homeScore,
    );
    assert.equal(
      result.events.filter(
        (event) => event.type === "GOAL" && event.team === "AWAY",
      ).length,
      result.awayScore,
    );
    assert.equal(
      result.stats.home.possession + result.stats.away.possession,
      100,
    );
  });
});
