import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import { BadRequestException, UnauthorizedException } from "@nestjs/common";

import { UsersService } from "../../src/users/users.service";

const profileDate = new Date("2026-05-15T09:00:00.000Z");

function createProfilePrismaMock() {
  let tournamentCountCalls = 0;

  return {
    $transaction: async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    savedSquad: {
      count: async () => 3,
    },
    tournament: {
      count: async () => {
        tournamentCountCalls += 1;

        return tournamentCountCalls === 1 ? 4 : 1;
      },
    },
    user: {
      findUnique: async () => ({
        avatarUrl: "/avatars/demo.png",
        createdAt: profileDate,
        email: "demo@futdraft.local",
        id: "user-id",
        nickname: "demo_user",
      }),
    },
  };
}

describe("UsersService", () => {
  it("returns profile with tournament and saved squad stats", async () => {
    const service = new UsersService(createProfilePrismaMock() as never);

    const result = await service.getProfile("user-id");

    assert.deepEqual(result, {
      avatarUrl: "/avatars/demo.png",
      createdAt: profileDate.toISOString(),
      email: "demo@futdraft.local",
      id: "user-id",
      nickname: "demo_user",
      stats: {
        savedSquads: 3,
        tournamentsPlayed: 4,
        tournamentsWon: 1,
      },
    });
  });

  it("throws unauthorized when profile user does not exist", async () => {
    const prisma = {
      $transaction: async (operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
      savedSquad: {
        count: async () => 0,
      },
      tournament: {
        count: async () => 0,
      },
      user: {
        findUnique: async () => null,
      },
    };
    const service = new UsersService(prisma as never);

    await assert.rejects(() => service.getProfile("missing-id"), UnauthorizedException);
  });

  it("normalizes empty avatar string to null on update", async () => {
    let updateData: { avatarUrl?: string | null } | null = null;
    const prisma = {
      ...createProfilePrismaMock(),
      user: {
        findUnique: async () => ({
          avatarUrl: null,
          createdAt: profileDate,
          email: "demo@futdraft.local",
          id: "user-id",
          nickname: "demo_user",
        }),
        update: async (args: { data: { avatarUrl?: string | null } }) => {
          updateData = args.data;

          return {};
        },
      },
    };
    const service = new UsersService(prisma as never);

    await service.updateProfile("user-id", { avatarUrl: "   " });

    assert.deepEqual(updateData, { avatarUrl: null });
  });

  it("rejects avatar value that is not URL or image data URL", async () => {
    const prisma = createProfilePrismaMock();
    const service = new UsersService(prisma as never);

    await assert.rejects(
      () => service.updateProfile("user-id", { avatarUrl: "not-an-image" }),
      BadRequestException,
    );
  });
});
