import { Module } from "@nestjs/common";

import { DraftController } from "./draft.controller";
import { DraftService } from "./draft.service";
import { MatchSimulatorService } from "./match-simulator.service";

@Module({
  controllers: [DraftController],
  providers: [DraftService, MatchSimulatorService],
})
export class DraftModule {}
