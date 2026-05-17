import { IsString, MinLength } from "class-validator";

import { ApiProperty } from "@nestjs/swagger";

export class RefreshDto {
  @ApiProperty({
    description: "JWT refresh token returned by login/register/refresh.",
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
