import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcceptSuggestionsDto } from './dto/accept-suggestions.dto';
import { FreeSlotsDto } from './dto/free-slots.dto';
import { SuggestStudyBlocksDto } from './dto/suggest-study-blocks.dto';
import { ClaudeService, SuggestedBlock } from './claude.service';
import { findFreeSlots, isRangeWithinAnySlot, TimeRange } from './free-slot-finder';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly claudeService: ClaudeService,
  ) {}

  private async computeFreeSlots(userId: string, dto: FreeSlotsDto): Promise<TimeRange[]> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    if (from.getTime() >= to.getTime()) {
      throw new BadRequestException('O período informado ("from"/"to") é inválido.');
    }

    const busyEvents = await this.prisma.event.findMany({
      where: { userId, startAt: { lt: to }, endAt: { gt: from } },
      select: { startAt: true, endAt: true },
    });

    return findFreeSlots({
      from,
      to,
      busy: busyEvents.map((e) => ({ start: e.startAt, end: e.endAt })),
      workingHours: { start: dto.workingHoursStart!, end: dto.workingHoursEnd! },
      minDurationMinutes: dto.minDurationMinutes!,
    });
  }

  async getFreeSlots(userId: string, dto: FreeSlotsDto) {
    const slots = await this.computeFreeSlots(userId, dto);
    return slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() }));
  }

  /**
   * Distribuição determinística usada como fallback quando a IA generativa não está
   * configurada ou falha: aloca os horários livres às matérias mais distantes da meta.
   */
  private naiveDistribution(
    freeSlots: TimeRange[],
    subjects: { name: string; weeklyGoalMinutes: number }[],
    preferredBlockMinutes: number,
  ): SuggestedBlock[] {
    const remainingGoalMs = new Map(subjects.map((s) => [s.name, s.weeklyGoalMinutes * 60 * 1000]));
    const preferredMs = preferredBlockMinutes * 60 * 1000;
    const minBlockMs = 20 * 60 * 1000;
    const blocks: SuggestedBlock[] = [];

    for (const slot of freeSlots) {
      let cursor = slot.start.getTime();
      const slotEnd = slot.end.getTime();

      while (slotEnd - cursor >= minBlockMs) {
        const subjectEntry = [...remainingGoalMs.entries()].sort((a, b) => b[1] - a[1])[0];
        if (!subjectEntry || subjectEntry[1] <= 0) break;

        const [subjectName, remaining] = subjectEntry;
        const blockMs = Math.min(preferredMs, remaining, slotEnd - cursor);
        if (blockMs < minBlockMs) break;

        const startAt = new Date(cursor);
        const endAt = new Date(cursor + blockMs);
        blocks.push({
          subject: subjectName,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          rationale: 'Alocação automática proporcional à meta semanal restante (sem IA generativa).',
        });

        remainingGoalMs.set(subjectName, remaining - blockMs);
        cursor += blockMs;
      }
    }

    return blocks;
  }

  async suggestStudyBlocks(userId: string, dto: SuggestStudyBlocksDto) {
    const freeSlots = await this.computeFreeSlots(userId, dto);
    if (freeSlots.length === 0) {
      return { blocks: [], usedAi: false };
    }

    if (this.claudeService.isConfigured) {
      try {
        const blocks = await this.claudeService.suggestStudyBlocks({
          freeSlots,
          subjects: dto.subjects,
          preferredBlockMinutes: dto.preferredBlockMinutes!,
        });

        const valid = blocks.filter((b) =>
          isRangeWithinAnySlot({ start: new Date(b.startAt), end: new Date(b.endAt) }, freeSlots),
        );

        if (valid.length > 0) {
          return { blocks: valid, usedAi: true };
        }
        this.logger.warn('Sugestões da IA fora dos horários livres; usando fallback determinístico.');
      } catch (error) {
        this.logger.error(`Falha ao consultar a IA de sugestão de blocos: ${(error as Error).message}`);
      }
    }

    const blocks = this.naiveDistribution(freeSlots, dto.subjects, dto.preferredBlockMinutes!);
    return { blocks, usedAi: false };
  }

  async acceptSuggestions(userId: string, dto: AcceptSuggestionsDto) {
    const from = dto.blocks.reduce(
      (min, b) => (new Date(b.startAt) < min ? new Date(b.startAt) : min),
      new Date(dto.blocks[0].startAt),
    );
    const to = dto.blocks.reduce(
      (max, b) => (new Date(b.endAt) > max ? new Date(b.endAt) : max),
      new Date(dto.blocks[0].endAt),
    );

    const currentFreeSlots = await this.computeFreeSlots(userId, {
      from: from.toISOString(),
      to: to.toISOString(),
      minDurationMinutes: 1,
      workingHoursStart: '00:00',
      workingHoursEnd: '23:59',
    });

    const invalidBlocks = dto.blocks.filter(
      (b) => !isRangeWithinAnySlot({ start: new Date(b.startAt), end: new Date(b.endAt) }, currentFreeSlots),
    );

    if (invalidBlocks.length > 0) {
      throw new BadRequestException({
        message: 'Alguns blocos não cabem mais na agenda (provavelmente ela mudou desde a sugestão).',
        invalidBlocks,
      });
    }

    return this.prisma.$transaction(
      dto.blocks.map((b) =>
        this.prisma.event.create({
          data: {
            userId,
            title: b.subject,
            description: b.rationale,
            type: 'STUDY_BLOCK',
            source: 'AI_SUGGESTED',
            startAt: new Date(b.startAt),
            endAt: new Date(b.endAt),
          },
        }),
      ),
    );
  }
}
