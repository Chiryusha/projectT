import { IsInt, IsOptional, IsUUID, Min } from "class-validator";

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PickPlayerDto {
  @ApiProperty({
    description: "Player card option id selected by user.",
    format: "uuid",
  })
  @IsUUID()
  playerCardId!: string;

  @ApiPropertyOptional({
    description: "Target draft slot. If omitted, current session slot is used.",
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  slotNo?: number;
}
