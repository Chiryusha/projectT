import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class TrackPageViewDto {
  @IsString()
  @MaxLength(120)
  page!: string;
}

export class TrackFrontendEventDto {
  @IsString()
  @MaxLength(80)
  event!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  page?: string;

  @IsOptional()
  @IsIn(["error", "info", "warning"])
  level?: "error" | "info" | "warning";

  @IsOptional()
  @IsString()
  @MaxLength(240)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;
}