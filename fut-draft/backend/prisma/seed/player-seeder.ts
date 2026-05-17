import { PrismaClient, type Prisma } from "@prisma/client";

import { PLAYER_IMAGE_PUBLIC_PATH } from "./config";
import {
  fileExists,
  resolveLocalImagePath,
  cachePlayerImage,
} from "./image-cache";
import { buildStats } from "./player-stats";
import type { SeedPlayer } from "./types";

export async function seedPlayer(
  prisma: PrismaClient,
  player: SeedPlayer,
  index: number,
  allowMissingImageGold = false,
): Promise<boolean> {
  const cachedImage = await cachePlayerImage(player);
  const cardRarity =
    allowMissingImageGold || cachedImage.imageUrl ? "gold" : "no-image";

  const storedPlayer = await prisma.player.upsert({
    where: { fullName: player.fullName },
    update: {
      club: player.club,
      imageSource: cachedImage.imageSource,
      imageUrl: cachedImage.imageUrl,
      league: player.league,
      nation: player.nation,
      primaryPosition: player.primaryPosition,
    },
    create: {
      club: player.club,
      fullName: player.fullName,
      imageSource: cachedImage.imageSource,
      imageUrl: cachedImage.imageUrl,
      league: player.league,
      nation: player.nation,
      primaryPosition: player.primaryPosition,
    },
  });
  const stats = buildStats(player, index);

  await prisma.playerCard.upsert({
    where: {
      playerId_rarity_overall_basePosition: {
        basePosition: player.primaryPosition,
        overall: player.overall,
        playerId: storedPlayer.id,
        rarity: cardRarity,
      },
    },
    update: {
      defending: stats.defending,
      dribbling: stats.dribbling,
      pace: stats.pace,
      passing: stats.passing,
      physical: stats.physical,
      shooting: stats.shooting,
    },
    create: {
      basePosition: player.primaryPosition,
      defending: stats.defending,
      dribbling: stats.dribbling,
      overall: player.overall,
      pace: stats.pace,
      passing: stats.passing,
      physical: stats.physical,
      playerId: storedPlayer.id,
      rarity: cardRarity,
      shooting: stats.shooting,
    },
  });

  return cardRarity === "gold";
}

export async function markGeneratedFallbackCards(
  prisma: PrismaClient,
): Promise<number> {
  return markGoldCardsAsDisabled(
    prisma,
    {
      player: {
        league: "Fallback League",
      },
      rarity: "gold",
    },
    "generated-fallback",
  );
}

export async function markSportsDbGoldCardsAsDisabled(
  prisma: PrismaClient,
): Promise<number> {
  return markGoldCardsAsDisabled(
    prisma,
    {
      player: {
        league: {
          not: "Fallback League",
        },
      },
      rarity: "gold",
    },
    "sportsdb-disabled",
  );
}

export async function markNoImageGoldCards(
  prisma: PrismaClient,
  disableFallbackCards: boolean,
): Promise<number> {
  await clearMissingLocalImageUrls(prisma);

  return markGoldCardsAsDisabled(
    prisma,
    {
      player: {
        imageUrl: null,
        ...(disableFallbackCards
          ? {}
          : {
              league: {
                not: "Fallback League",
              },
            }),
      },
      rarity: "gold",
    },
    "no-image",
  );
}

export async function countPlayersWithCachedImages(
  prisma: PrismaClient,
): Promise<number> {
  return prisma.player.count({
    where: {
      imageUrl: {
        startsWith: PLAYER_IMAGE_PUBLIC_PATH,
      },
    },
  });
}

async function clearMissingLocalImageUrls(
  prisma: PrismaClient,
): Promise<number> {
  const players = await prisma.player.findMany({
    where: {
      imageUrl: {
        startsWith: PLAYER_IMAGE_PUBLIC_PATH,
      },
    },
    select: {
      id: true,
      imageUrl: true,
    },
  });
  let clearedCount = 0;

  for (const player of players) {
    const localImagePath = player.imageUrl
      ? resolveLocalImagePath(player.imageUrl)
      : null;

    if (localImagePath && (await fileExists(localImagePath))) {
      continue;
    }

    await prisma.player.update({
      where: {
        id: player.id,
      },
      data: {
        imageSource: null,
        imageUrl: null,
      },
    });
    clearedCount += 1;
  }

  return clearedCount;
}

async function markGoldCardsAsDisabled(
  prisma: PrismaClient,
  where: Prisma.PlayerCardWhereInput,
  targetRarity: string,
): Promise<number> {
  const cards = await prisma.playerCard.findMany({
    where,
    select: {
      basePosition: true,
      id: true,
      overall: true,
      playerId: true,
    },
  });

  for (const card of cards) {
    const existingDisabledCard = await prisma.playerCard.findFirst({
      where: {
        basePosition: card.basePosition,
        id: {
          not: card.id,
        },
        overall: card.overall,
        playerId: card.playerId,
        rarity: targetRarity,
      },
      select: {
        id: true,
      },
    });

    await prisma.playerCard.update({
      where: {
        id: card.id,
      },
      data: {
        rarity: existingDisabledCard
          ? `${targetRarity}-${card.id.slice(0, 8)}`
          : targetRarity,
      },
    });
  }

  return cards.length;
}
