import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertValidRange(startAt: string, endAt: string) {
    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      throw new BadRequestException('O horário de início deve ser anterior ao horário de término.');
    }
  }

  async create(userId: string, dto: CreateEventDto) {
    this.assertValidRange(dto.startAt, dto.endAt);

    return this.prisma.event.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        allDay: dto.allDay ?? false,
        color: dto.color,
        source: dto.source ?? 'MANUAL',
        recurrenceRule: dto.recurrenceRule,
      },
    });
  }

  /** Visão unificada da agenda (compromissos, rotina e blocos de estudo) por período. */
  async findAgenda(userId: string, query: QueryEventsDto) {
    return this.prisma.event.findMany({
      where: {
        userId,
        ...(query.types?.length ? { type: { in: query.types } } : {}),
        startAt: { lt: new Date(query.to) },
        endAt: { gt: new Date(query.from) },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async findOneOrFail(userId: string, id: string) {
    const event = await this.prisma.event.findFirst({ where: { id, userId } });
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }
    return event;
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    const existing = await this.findOneOrFail(userId, id);

    const startAt = dto.startAt ?? existing.startAt.toISOString();
    const endAt = dto.endAt ?? existing.endAt.toISOString();
    this.assertValidRange(startAt, endAt);

    return this.prisma.event.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        allDay: dto.allDay,
        color: dto.color,
        source: dto.source,
        recurrenceRule: dto.recurrenceRule,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOneOrFail(userId, id);
    await this.prisma.event.delete({ where: { id } });
    return { success: true };
  }
}
