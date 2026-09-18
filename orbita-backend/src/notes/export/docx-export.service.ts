import { Injectable } from '@nestjs/common';
import { Document, HeadingLevel, Packer, Paragraph, TextRun as DocxTextRun } from 'docx';
import { NoteBlock } from '../note-block.types';

const HEADING_LEVEL: Record<1 | 2 | 3, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
};

@Injectable()
export class DocxExportService {
  async render(title: string, blocks: NoteBlock[]): Promise<Buffer> {
    const children: Paragraph[] = [
      new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
      ...blocks.flatMap((block) => this.renderBlock(block)),
    ];

    const doc = new Document({ sections: [{ children }] });
    return Packer.toBuffer(doc);
  }

  private renderBlock(block: NoteBlock): Paragraph[] {
    switch (block.type) {
      case 'heading':
        return [new Paragraph({ text: block.text, heading: HEADING_LEVEL[block.level] })];
      case 'paragraph':
        return [
          new Paragraph({
            children: block.runs.map(
              (run) =>
                new DocxTextRun({ text: run.text, bold: run.bold, italics: run.italic, underline: run.underline ? {} : undefined }),
            ),
          }),
        ];
      case 'bulletList':
        return block.items.map((item) => new Paragraph({ text: item, bullet: { level: 0 } }));
      case 'orderedList':
        return block.items.map(
          (item, index) => new Paragraph({ text: `${index + 1}. ${item}` }),
        );
    }
  }
}
