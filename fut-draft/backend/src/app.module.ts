import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module";
import { DraftModule } from "./draft/draft.module";
import { HealthModule } from "./health/health.module";
import { MonitoringModule } from "./monitoring/monitoring.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MonitoringModule,
    HealthModule,
    UsersModule,
    AuthModule,
    DraftModule,
  ],
})
export class AppModule {}
