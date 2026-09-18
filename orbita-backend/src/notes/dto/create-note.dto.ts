import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  title: string;

  /** Validado estruturalmente em NotesService via parseNoteBlocks(). */
  @IsArray()
  blocks: unknown[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
