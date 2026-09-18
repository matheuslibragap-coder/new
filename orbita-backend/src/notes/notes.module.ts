import { Module } from '@nestjs/common';
import { DocxExportService } from './export/docx-export.service';
import { PdfExportService } from './export/pdf-export.service';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, PdfExportService, DocxExportService],
})
export class NotesModule {}
