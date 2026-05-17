import { PrismaClient } from "@prisma/client";

import { FALLBACK_PLAYERS } from "./seed/fallback-players";
import { seedDemoUser } from "./seed/demo-user.seed";
import {
  countPlayersWithCachedImages,
  markGeneratedFallbackCards,
  markNoImageGoldCards,
  markSportsDbGoldCardsAsDisabled,
  seedPlayer,
} from "./seed/player-seeder";
import { dedupePlayers, fetchSportsDbSeedPlayers } from "./seed/sportsdb";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedDemoUser(prisma);

  const sportsDbPlayers = dedupePlayers(await fetchSportsDbSeedPlayers());
  const useFallbackCatalog = sportsDbPlayers.length === 0;
  const players = useFallbackCatalog ? FALLBACK_PLAYERS : sportsDbPlayers;
  let activeGoldCards = 0;

  for (const [index, player] of players.entries()) {
    const isActiveGoldCard = await seedPlayer(
      prisma,
      player,
      index,
      useFallbackCatalog,
    );

    if (isActiveGoldCard) {
      activeGoldCards += 1;
    }
  }

  const generatedFallbackCards = useFallbackCatalog
    ? 0
    : await markGeneratedFallbackCards(prisma);
  const sportsDbDisabledCards = useFallbackCatalog
    ? await markSportsDbGoldCardsAsDisabled(prisma)
    : 0;
  const noImageCards = await markNoImageGoldCards(prisma, !useFallbackCatalog);
  const playersWithImages = await countPlayersWithCachedImages(prisma);

  console.log(
    `Seed completed: ${activeGoldCards} active gold player cards and demo user are ready.`,
  );
  console.log(
    `TheSportsDB imported players: ${sportsDbPlayers.length}. Catalog mode: ${
      useFallbackCatalog ? "fallback" : "sportsdb"
    }.`,
  );
  console.log(`Local cached images: ${playersWithImages}`);
  console.log(`Generated fallback cards disabled: ${generatedFallbackCards}`);
  console.log(`SportsDB gold cards disabled: ${sportsDbDisabledCards}`);
  console.log(`No-image gold cards disabled: ${noImageCards}`);
  console.log(
    "Demo user credentials -> email: demo@futdraft.local | password: Demo12345!",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
