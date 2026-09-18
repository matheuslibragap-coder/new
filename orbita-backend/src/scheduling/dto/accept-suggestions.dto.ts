import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

export class SuggestedBlockDto {
  @IsString()
  @MinLength(1)
  subject: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsString()
  rationale?: string;
}

export class AcceptSuggestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SuggestedBlockDto)
  blocks: SuggestedBlockDto[];
}
