import { IsDateString, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class FreeSlotsDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  minDurationMinutes?: number = 30;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'workingHoursStart deve estar no formato HH:mm' })
  workingHoursStart?: string = '08:00';

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'workingHoursEnd deve estar no formato HH:mm' })
  workingHoursEnd?: string = '22:00';
}
