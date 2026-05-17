import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TournamentStatus } from "@prisma/client";
import { hash } from "bcryptjs";

import { PrismaService } from "../prisma/prisma.service";
import type { AuthUserResponse } from "../auth/types/auth-response.type";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { UserProfileResponse } from "./types/user-response.type";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<AuthUserResponse> {
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

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async findAll(): Promise<AuthUserResponse[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        nickname: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const [user, tournamentsPlayed, tournamentsWon, savedSquads] =
      await this.prisma.$transaction([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            nickname: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        }),
        this.prisma.tournament.count({
          where: {
            session: {
              userId,
            },
          },
        }),
        this.prisma.tournament.count({
          where: {
            status: TournamentStatus.CHAMPION,
            session: {
              userId,
            },
          },
        }),
        this.prisma.savedSquad.count({
          where: {
            userId,
          },
        }),
      ]);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      stats: {
        savedSquads,
        tournamentsPlayed,
        tournamentsWon,
      },
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const avatarUrl =
      dto.avatarUrl === undefined
        ? undefined
        : this.normalizeAvatarUrl(dto.avatarUrl);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
    });

    return this.getProfile(userId);
  }

  private normalizeAvatarUrl(avatarUrl: string | null) {
    if (avatarUrl === null) {
      return null;
    }

    const trimmedAvatarUrl = avatarUrl.trim();

    if (!trimmedAvatarUrl) {
      return null;
    }

    if (trimmedAvatarUrl.length > 700_000) {
      throw new BadRequestException("Avatar image is too large");
    }

    if (/^https?:\/\/\S+$/i.test(trimmedAvatarUrl)) {
      return trimmedAvatarUrl;
    }

    if (
      /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(
        trimmedAvatarUrl,
      )
    ) {
      return trimmedAvatarUrl;
    }

    throw new BadRequestException(
      "Avatar must be an image URL or PNG/JPEG/WEBP data URL",
    );
  }
}
