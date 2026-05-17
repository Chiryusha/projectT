import { randomUUID } from "crypto";

import {
  ConflictException,
  Injectable,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";

import { MetricsService } from "../monitoring/metrics.service";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import type {
  AuthResponse,
  AuthTokensResponse,
  AuthUserResponse,
  LogoutResponse,
} from "./types/auth-response.type";
import { AuthUser } from "./types/auth-user.type";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { nickname: dto.nickname }],
      },
      select: { id: true },
    });

    if (existingUser) {
      this.metrics?.recordAuthEvent("register", "failure");
      throw new ConflictException(
        "User with same email or nickname already exists",
      );
    }

    const passwordHash = await hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        nickname: dto.nickname,
        email: dto.email,
        passwordHash,
      },
      select: {
        id: true,
        nickname: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    });
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);

    this.metrics?.recordAuthEvent("register", "success");

    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        nickname: true,
        email: true,
        avatarUrl: true,
        passwordHash: true,
      },
    });

    if (!user) {
      this.metrics?.recordAuthEvent("login", "failure");
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      this.metrics?.recordAuthEvent("login", "failure");
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: AuthUser = {
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    };

    const tokens = await this.issueTokens(payload);
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);

    this.metrics?.recordAuthEvent("login", "success");

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const refreshSecret =
      this.configService.get<string>("JWT_REFRESH_SECRET") ??
      "local-refresh-secret";

    let payload: AuthUser;

    try {
      payload = await this.jwtService.verifyAsync<AuthUser>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      this.metrics?.recordAuthEvent("refresh", "failure");
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nickname: true,
        email: true,
        avatarUrl: true,
        refreshTokenHash: true,
      },
    });

    if (!user?.refreshTokenHash) {
      this.metrics?.recordAuthEvent("refresh", "failure");
      throw new UnauthorizedException("Refresh token is not active");
    }

    const refreshMatches = await compare(refreshToken, user.refreshTokenHash);

    if (!refreshMatches) {
      this.metrics?.recordAuthEvent("refresh", "failure");
      throw new UnauthorizedException("Invalid refresh token");
    }

    const newPayload: AuthUser = {
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    };

    const tokens = await this.issueTokens(newPayload);
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);

    this.metrics?.recordAuthEvent("refresh", "success");

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  async getProfile(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async logout(userId: string): Promise<LogoutResponse> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    this.metrics?.recordAuthEvent("logout", "success");

    return { success: true };
  }

  private async issueTokens(payload: AuthUser): Promise<AuthTokensResponse> {
    const accessSecret =
      this.configService.get<string>("JWT_ACCESS_SECRET") ??
      "local-access-secret";
    const refreshSecret =
      this.configService.get<string>("JWT_REFRESH_SECRET") ??
      "local-refresh-secret";

    const accessExpiresIn =
      this.configService.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m";
    const refreshExpiresIn =
      this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d";

    const jwtId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
        jwtid: jwtId,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
        jwtid: `${jwtId}-refresh`,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
    };
  }

  private async saveRefreshTokenHash(userId: string, refreshToken: string) {
    const refreshTokenHash = await hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }
}
