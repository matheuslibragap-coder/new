import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { FreeSlotsDto } from './free-slots.dto';

export class SubjectGoalDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsInt()
  @Min(1)
  weeklyGoalMinutes: number;
}

export class SuggestStudyBlocksDto extends FreeSlotsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubjectGoalDto)
  subjects: SubjectGoalDto[];

  @IsOptional()
  @IsInt()
  @Min(10)
  preferredBlockMinutes?: number = 50;
}
