import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import { ForbiddenException, NotFoundException } from "@nestjs/common";

import { DraftService } from "../../src/draft/draft.service";

const createService = (prisma: unknown) => {
  return new DraftService(prisma as never, {} as never);
};

describe("DraftService", () => {
  it("returns picked players with summary and chemistry scaled to 100", async () => {
    const pickedAt = new Date("2026-05-15T10:00:00.000Z");
    const prisma = {
      draftPick: {
        findMany: async () => [
          {
            pickedAt,
            playerCard: {
              basePosition: "GK",
              id: "card-gk",
              overall: 88,
              player: {
                club: "FUT Club",
                fullName: "Alex Keeper",
                imageUrl: "/player-images/alex-keeper.png",
                league: "Premier League",
                nation: "Brazil",
              },
              rarity: "gold",
            },
            slotNo: 1,
          },
          {
            pickedAt,
            playerCard: {
              basePosition: "RB",
              id: "card-rb",
              overall: 84,
              player: {
                club: "FUT Club",
                fullName: "Bruno Runner",
                imageUrl: "/player-images/bruno-runner.png",
                league: "Premier League",
                nation: "Brazil",
              },
              rarity: "gold",
            },
            slotNo: 2,
          },
        ],
      },
      draftSession: {
        findUnique: async (args: { select?: Record<string, boolean> }) => {
          if (args.select?.userId) {
            return {
              id: "session-id",
              userId: "user-id",
            };
          }

          return {
            formation: "4-3-3",
          };
        },
      },
    };
    const service = createService(prisma);

    const result = await service.getPicks("session-id", "user-id");

    assert.equal(result.sessionId, "session-id");
    assert.equal(result.summary.totalPicked, 2);
    assert.equal(result.summary.goalkeepersPicked, 1);
    assert.equal(result.picks[0].pickedAt, pickedAt.toISOString());
    assert.equal(result.chemistry.maxTeamChemistry, 100);
    assert.equal(result.chemistry.teamChemistry, 18);
    assert.equal(result.chemistry.players[0].chemistry, 5);
    assert.deepEqual(result.chemistry.players[0].reasons, [
      "position-fit",
      "club-link",
      "league-link",
      "nation-link",
    ]);
  });

  it("does not allow reading another user's picks", async () => {
    const prisma = {
      draftSession: {
        findUnique: async () => ({
          id: "session-id",
          userId: "other-user-id",
        }),
      },
    };
    const service = createService(prisma);

    await assert.rejects(
      () => service.getPicks("session-id", "user-id"),
      ForbiddenException,
    );
  });

  it("maps saved squads and serializes created date", async () => {
    const createdAt = new Date("2026-05-15T11:00:00.000Z");
    const snapshot = {
      chemistry: {
        averagePlayerChemistry: 4.8,
        maxTeamChemistry: 100,
        players: [],
        teamChemistry: 92,
      },
      formation: "4-3-3",
      picks: [],
      savedAt: "2026-05-15T11:00:00.000Z",
      sessionId: "session-id",
    };
    let findManyArgs: unknown = null;
    const prisma = {
      savedSquad: {
        findMany: async (args: unknown) => {
          findManyArgs = args;

          return [
            {
              chemistry: 92,
              createdAt,
              formation: "4-3-3",
              id: "saved-squad-id",
              name: "My Squad",
              rating: 87,
              sessionId: "session-id",
              snapshot,
              userId: "user-id",
            },
          ];
        },
      },
    };
    const service = createService(prisma);

    const result = await service.getSavedSquads("user-id");

    assert.deepEqual(findManyArgs, {
      orderBy: { createdAt: "desc" },
      where: { userId: "user-id" },
    });
    assert.deepEqual(result, [
      {
        chemistry: 92,
        createdAt: createdAt.toISOString(),
        formation: "4-3-3",
        id: "saved-squad-id",
        name: "My Squad",
        rating: 87,
        sessionId: "session-id",
        snapshot,
      },
    ]);
  });

  it("deletes only current user's saved squad", async () => {
    let deleteManyArgs: unknown = null;
    const prisma = {
      savedSquad: {
        deleteMany: async (args: unknown) => {
          deleteManyArgs = args;

          return { count: 1 };
        },
      },
    };
    const service = createService(prisma);

    const result = await service.deleteSavedSquad("saved-squad-id", "user-id");

    assert.deepEqual(deleteManyArgs, {
      where: {
        id: "saved-squad-id",
        userId: "user-id",
      },
    });
    assert.deepEqual(result, {
      deletedCount: 1,
      success: true,
    });
  });

  it("throws when saved squad delete target does not exist", async () => {
    const prisma = {
      savedSquad: {
        deleteMany: async () => ({ count: 0 }),
      },
    };
    const service = createService(prisma);

    await assert.rejects(
      () => service.deleteSavedSquad("missing-id", "user-id"),
      NotFoundException,
    );
  });

  it("clears all saved squads for current user", async () => {
    let deleteManyArgs: unknown = null;
    const prisma = {
      savedSquad: {
        deleteMany: async (args: unknown) => {
          deleteManyArgs = args;

          return { count: 3 };
        },
      },
    };
    const service = createService(prisma);

    const result = await service.clearSavedSquads("user-id");

    assert.deepEqual(deleteManyArgs, {
      where: { userId: "user-id" },
    });
    assert.deepEqual(result, {
      deletedCount: 3,
      success: true,
    });
  });
});
