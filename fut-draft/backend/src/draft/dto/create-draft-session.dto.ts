import { IsIn, IsOptional, IsString } from "class-validator";

import { ApiPropertyOptional } from "@nestjs/swagger";

import { FORMATION_CODES } from "../draft.constants";

export class CreateDraftSessionDto {
  @ApiPropertyOptional({
    enum: FORMATION_CODES,
    example: "4-3-3",
  })
  @IsOptional()
  @IsString()
  @IsIn(FORMATION_CODES)
  formation?: string;
}
