import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { compare, hash } from "bcryptjs";

import { AuthService } from "../../src/auth/auth.service";

const configValues: Record<string, string> = {
  JWT_ACCESS_EXPIRES_IN: "15m",
  JWT_ACCESS_SECRET: "access-secret",
  JWT_REFRESH_EXPIRES_IN: "7d",
  JWT_REFRESH_SECRET: "refresh-secret",
};

const createJwtService = () => ({
  signAsync: async (_payload: unknown, options: { secret?: string }) => {
    return options.secret === "access-secret"
      ? "access-token"
      : "refresh-token";
  },
  verifyAsync: async () => ({
    email: "demo@futdraft.local",
    nickname: "demo_user",
    sub: "user-id",
  }),
});

const createConfigService = () => ({
  get: (key: string) => configValues[key],
});

describe("AuthService", () => {
  it("registers user and stores hashed refresh token", async () => {
    const createdAt = new Date("2026-05-15T08:00:00.000Z");
    let savedRefreshTokenHash: string | null = null;

    const prisma = {
      user: {
        findFirst: async () => null,
        create: async () => ({
          avatarUrl: null,
          createdAt,
          email: "new@futdraft.local",
          id: "new-user-id",
          nickname: "new_user",
        }),
        update: async (args: { data: { refreshTokenHash: string } }) => {
          savedRefreshTokenHash = args.data.refreshTokenHash;

          return {};
        },
      },
    };
    const service = new AuthService(
      prisma as never,
      createJwtService() as never,
      createConfigService() as never,
    );

    const result = await service.register({
      email: "new@futdraft.local",
      nickname: "new_user",
      password: "Demo12345!",
    });

    assert.deepEqual(result.user, {
      avatarUrl: null,
      createdAt: createdAt.toISOString(),
      email: "new@futdraft.local",
      id: "new-user-id",
      nickname: "new_user",
    });
    assert.equal(
      await compare("refresh-token", savedRefreshTokenHash ?? ""),
      true,
    );
  });

  it("rejects register when email or nickname already exists", async () => {
    const prisma = {
      user: {
        findFirst: async () => ({
          id: "existing-user-id",
        }),
      },
    };
    const service = new AuthService(
      prisma as never,
      createJwtService() as never,
      createConfigService() as never,
    );

    await assert.rejects(
      () =>
        service.register({
          email: "demo@futdraft.local",
          nickname: "demo_user",
          password: "Demo12345!",
        }),
      ConflictException,
    );
  });

  it("logs in user and stores hashed refresh token", async () => {
    const passwordHash = await hash("Demo12345!", 10);
    let savedRefreshTokenHash: string | null = null;

    const prisma = {
      user: {
        findUnique: async () => ({
          avatarUrl: null,
          email: "demo@futdraft.local",
          id: "user-id",
          nickname: "demo_user",
          passwordHash,
        }),
        update: async (args: { data: { refreshTokenHash: string } }) => {
          savedRefreshTokenHash = args.data.refreshTokenHash;

          return {};
        },
      },
    };
    const service = new AuthService(
      prisma as never,
      createJwtService() as never,
      createConfigService() as never,
    );

    const result = await service.login({
      email: "demo@futdraft.local",
      password: "Demo12345!",
    });

    assert.equal(result.user.id, "user-id");
    assert.deepEqual(result.tokens, {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
    });
    assert.equal(
      await compare("refresh-token", savedRefreshTokenHash ?? ""),
      true,
    );
  });

  it("rejects login with invalid password", async () => {
    const passwordHash = await hash("Demo12345!", 10);
    const prisma = {
      user: {
        findUnique: async () => ({
          avatarUrl: null,
          email: "demo@futdraft.local",
          id: "user-id",
          nickname: "demo_user",
          passwordHash,
        }),
      },
    };
    const service = new AuthService(
      prisma as never,
      createJwtService() as never,
      createConfigService() as never,
    );

    await assert.rejects(
      () =>
        service.login({
          email: "demo@futdraft.local",
          password: "wrong-password",
        }),
      UnauthorizedException,
    );
  });

  it("refreshes tokens when stored refresh token matches", async () => {
    const refreshTokenHash = await hash("refresh-token", 10);
    let savedRefreshTokenHash: string | null = null;

    const prisma = {
      user: {
        findUnique: async () => ({
          avatarUrl: null,
          email: "demo@futdraft.local",
          id: "user-id",
          nickname: "demo_user",
          refreshTokenHash,
        }),
        update: async (args: { data: { refreshTokenHash: string } }) => {
          savedRefreshTokenHash = args.data.refreshTokenHash;

          return {};
        },
      },
    };
    const service = new AuthService(
      prisma as never,
      createJwtService() as never,
      createConfigService() as never,
    );

    const result = await service.refresh("refresh-token");

    assert.equal(result.user.id, "user-id");
    assert.deepEqual(result.tokens, {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
    });
    assert.equal(
      await compare("refresh-token", savedRefreshTokenHash ?? ""),
      true,
    );
  });

  it("rejects refresh when user has no active refresh token", async () => {
    const prisma = {
      user: {
        findUnique: async () => ({
          avatarUrl: null,
          email: "demo@futdraft.local",
          id: "user-id",
          nickname: "demo_user",
          refreshTokenHash: null,
        }),
      },
    };
    const service = new AuthService(
      prisma as never,
      createJwtService() as never,
      createConfigService() as never,
    );

    await assert.rejects(
      () => service.refresh("refresh-token"),
      UnauthorizedException,
    );
  });

  it("clears refresh token on logout", async () => {
    let clearedRefreshTokenHash: string | null = "not-cleared";
    const prisma = {
      user: {
        update: async (args: { data: { refreshTokenHash: null } }) => {
          clearedRefreshTokenHash = args.data.refreshTokenHash;

          return {};
        },
      },
    };
    const service = new AuthService(
      prisma as never,
      createJwtService() as never,
      createConfigService() as never,
    );

    const result = await service.logout("user-id");

    assert.deepEqual(result, { success: true });
    assert.equal(clearedRefreshTokenHash, null);
  });
});
