import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FocusSession } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';

function elapsedSecondsSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
}

@Injectable()
export class FocusService {
  constructor(private readonly prisma: PrismaService) {}

  async start(userId: string, dto: StartSessionDto) {
    if (dto.eventId) {
      const event = await this.prisma.event.findFirst({ where: { id: dto.eventId, userId } });
      if (!event) {
        throw new NotFoundException('Bloco de agenda informado não encontrado.');
      }
    }

    const now = new Date();
    return this.prisma.focusSession.create({
      data: {
        userId,
        eventId: dto.eventId,
        plannedDurationSec: dto.plannedDurationSec,
        status: 'RUNNING',
        startedAt: now,
        lastResumedAt: now,
      },
    });
  }

  private async findRunningOrPausedOrFail(userId: string, id: string): Promise<FocusSession> {
    const session = await this.prisma.focusSession.findFirst({ where: { id, userId } });
    if (!session) {
      throw new NotFoundException('Sessão de foco não encontrada.');
    }
    return session;
  }

  async pause(userId: string, id: string) {
    const session = await this.findRunningOrPausedOrFail(userId, id);
    if (session.status !== 'RUNNING') {
      throw new BadRequestException('Só é possível pausar uma sessão em andamento.');
    }

    const additionalSec = elapsedSecondsSince(session.lastResumedAt!);
    return this.prisma.focusSession.update({
      where: { id },
      data: {
        status: 'PAUSED',
        accumulatedSec: session.accumulatedSec + additionalSec,
        lastResumedAt: null,
      },
    });
  }

  async resume(userId: string, id: string) {
    const session = await this.findRunningOrPausedOrFail(userId, id);
    if (session.status !== 'PAUSED') {
      throw new BadRequestException('Só é possível retomar uma sessão pausada.');
    }

    return this.prisma.focusSession.update({
      where: { id },
      data: { status: 'RUNNING', lastResumedAt: new Date() },
    });
  }

  private async finish(userId: string, id: string, status: 'COMPLETED' | 'ABANDONED') {
    const session = await this.findRunningOrPausedOrFail(userId, id);
    if (session.status === 'COMPLETED' || session.status === 'ABANDONED') {
      throw new BadRequestException('Esta sessão já foi encerrada.');
    }

    const additionalSec = session.status === 'RUNNING' ? elapsedSecondsSince(session.lastResumedAt!) : 0;
    return this.prisma.focusSession.update({
      where: { id },
      data: {
        status,
        accumulatedSec: session.accumulatedSec + additionalSec,
        lastResumedAt: null,
        completedAt: new Date(),
      },
    });
  }

  complete(userId: string, id: string) {
    return this.finish(userId, id, 'COMPLETED');
  }

  abandon(userId: string, id: string) {
    return this.finish(userId, id, 'ABANDONED');
  }

  /** Duração real "ao vivo": soma o tempo já acumulado com o trecho em andamento, se houver. */
  private liveActualDurationSec(session: FocusSession): number {
    if (session.status === 'RUNNING' && session.lastResumedAt) {
      return session.accumulatedSec + elapsedSecondsSince(session.lastResumedAt);
    }
    return session.accumulatedSec;
  }

  private toSummary(session: FocusSession) {
    const actualDurationSec = this.liveActualDurationSec(session);
    return {
      ...session,
      actualDurationSec,
      varianceSec: actualDurationSec - session.plannedDurationSec,
    };
  }

  async findOneOrFail(userId: string, id: string) {
    const session = await this.findRunningOrPausedOrFail(userId, id);
    return this.toSummary(session);
  }

  async findAll(userId: string) {
    const sessions = await this.prisma.focusSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
    return sessions.map((s) => this.toSummary(s));
  }
}
