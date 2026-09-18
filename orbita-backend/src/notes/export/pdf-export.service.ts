import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { NoteBlock } from '../note-block.types';

const HEADING_FONT_SIZE: Record<1 | 2 | 3, number> = { 1: 22, 2: 18, 3: 15 };

@Injectable()
export class PdfExportService {
  render(title: string, blocks: NoteBlock[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 56 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.font('Helvetica-Bold').fontSize(24).text(title, { align: 'left' });
      doc.moveDown();

      for (const block of blocks) {
        this.renderBlock(doc, block);
        doc.moveDown(0.5);
      }

      doc.end();
    });
  }

  private renderBlock(doc: PDFKit.PDFDocument, block: NoteBlock) {
    switch (block.type) {
      case 'heading':
        doc
          .font('Helvetica-Bold')
          .fontSize(HEADING_FONT_SIZE[block.level])
          .text(block.text);
        break;
      case 'paragraph':
        doc.fontSize(11);
        for (const run of block.runs) {
          const font = run.bold && run.italic ? 'Helvetica-BoldOblique' : run.bold ? 'Helvetica-Bold' : run.italic ? 'Helvetica-Oblique' : 'Helvetica';
          doc.font(font).text(run.text, { continued: true, underline: !!run.underline });
        }
        doc.text('', { continued: false });
        break;
      case 'bulletList':
        doc.font('Helvetica').fontSize(11).list(block.items, { bulletRadius: 2 });
        break;
      case 'orderedList':
        doc.font('Helvetica').fontSize(11);
        block.items.forEach((item, index) => doc.text(`${index + 1}. ${item}`));
        break;
    }
  }
}
