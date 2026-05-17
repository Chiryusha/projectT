import { IsInt, Min } from "class-validator";

import { ApiProperty } from "@nestjs/swagger";

export class SwapPicksDto {
  @ApiProperty({
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  sourceSlotNo!: number;

  @ApiProperty({
    example: 12,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  targetSlotNo!: number;
}
