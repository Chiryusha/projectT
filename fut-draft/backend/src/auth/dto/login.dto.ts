import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "demo@futdraft.local",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "Demo12345!",
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
