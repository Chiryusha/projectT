import { IsOptional, IsString, MaxLength } from "class-validator";

import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: "Image URL or base64 data URL. Send null to clear avatar.",
    example: "https://example.com/avatar.png",
    maxLength: 700_000,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(700_000)
  avatarUrl?: string | null;
}
