import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    example: "demo_user",
    minLength: 3,
    maxLength: 24,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(24)
  nickname!: string;

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
