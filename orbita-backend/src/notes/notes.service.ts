import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteBlock, parseNoteBlocks, renderBlocksToHtml } from './note-block.types';
import { DocxExportService } from './export/docx-export.service';
import { PdfExportService } from './export/pdf-export.service';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfExportService: PdfExportService,
    private readonly docxExportService: DocxExportService,
  ) {}

  async create(userId: string, dto: CreateNoteDto) {
    const blocks = parseNoteBlocks(dto.blocks);
    return this.prisma.note.create({
      data: {
        userId,
        title: dto.title,
        contentJson: blocks as unknown as Prisma.InputJsonValue,
        contentHtml: renderBlocksToHtml(blocks),
        tags: dto.tags ?? [],
      },
    });
  }

  async findAll(userId: string, query: QueryNotesDto) {
    return this.prisma.note.findMany({
      where: {
        userId,
        ...(query.tag ? { tags: { has: query.tag } } : {}),
        ...(query.search
          ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { contentHtml: { contains: query.search, mode: 'insensitive' } }] }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneOrFail(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) {
      throw new NotFoundException('Nota não encontrada.');
    }
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    await this.findOneOrFail(userId, id);

    const blocks = dto.blocks ? parseNoteBlocks(dto.blocks) : undefined;

    return this.prisma.note.update({
      where: { id },
      data: {
        title: dto.title,
        tags: dto.tags,
        ...(blocks
          ? { contentJson: blocks as unknown as Prisma.InputJsonValue, contentHtml: renderBlocksToHtml(blocks) }
          : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOneOrFail(userId, id);
    await this.prisma.note.delete({ where: { id } });
    return { success: true };
  }

  async exportToPdf(userId: string, id: string): Promise<{ filename: string; buffer: Buffer }> {
    const note = await this.findOneOrFail(userId, id);
    const buffer = await this.pdfExportService.render(note.title, note.contentJson as unknown as NoteBlock[]);
    return { filename: `${this.sanitizeFilename(note.title)}.pdf`, buffer };
  }

  async exportToDocx(userId: string, id: string): Promise<{ filename: string; buffer: Buffer }> {
    const note = await this.findOneOrFail(userId, id);
    const buffer = await this.docxExportService.render(note.title, note.contentJson as unknown as NoteBlock[]);
    return { filename: `${this.sanitizeFilename(note.title)}.docx`, buffer };
  }

  private sanitizeFilename(title: string): string {
    const normalized = title
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return normalized || 'nota';
  }
}
