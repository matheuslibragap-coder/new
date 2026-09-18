import { IsOptional, IsString } from 'class-validator';

export class QueryNotesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}
