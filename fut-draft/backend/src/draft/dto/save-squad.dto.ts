import { IsOptional, IsString, MaxLength } from "class-validator";

import { ApiPropertyOptional } from "@nestjs/swagger";

export class SaveSquadDto {
  @ApiPropertyOptional({
    example: "My first draft",
    maxLength: 48,
  })
  @IsOptional()
  @IsString()
  @MaxLength(48)
  name?: string;
}
