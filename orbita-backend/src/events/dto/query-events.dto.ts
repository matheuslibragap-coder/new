import { EventType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class QueryEventsDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsArray()
  @IsEnum(EventType, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  types?: EventType[];
}
