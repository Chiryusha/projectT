import { IsIn, IsOptional } from "class-validator";

import { ApiPropertyOptional } from "@nestjs/swagger";

export const AI_DIFFICULTIES = ["easy", "normal", "hard"] as const;

export type AiDifficulty = (typeof AI_DIFFICULTIES)[number];

export class StartTournamentDto {
  @ApiPropertyOptional({
    enum: AI_DIFFICULTIES,
    example: "normal",
  })
  @IsOptional()
  @IsIn(AI_DIFFICULTIES)
  aiDifficulty?: AiDifficulty;
}
