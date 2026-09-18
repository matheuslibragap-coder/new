import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class StartSessionDto {
  @IsOptional()
  @IsString()
  eventId?: string;

  @IsInt()
  @Min(60, { message: 'A duração planejada deve ser de pelo menos 60 segundos.' })
  plannedDurationSec: number;
}
