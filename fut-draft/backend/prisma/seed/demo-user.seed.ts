import type { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

export async function seedDemoUser(prisma: PrismaClient): Promise<void> {
  const demoPasswordHash = await hash("Demo12345!", 10);

  await prisma.user.upsert({
    where: { nickname: "demo_user" },
    update: {
      email: "demo@futdraft.local",
      passwordHash: demoPasswordHash,
      refreshTokenHash: null,
    },
    create: {
      email: "demo@futdraft.local",
      nickname: "demo_user",
      passwordHash: demoPasswordHash,
    },
  });
}
