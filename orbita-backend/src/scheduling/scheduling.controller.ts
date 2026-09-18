import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AcceptSuggestionsDto } from './dto/accept-suggestions.dto';
import { FreeSlotsDto } from './dto/free-slots.dto';
import { SuggestStudyBlocksDto } from './dto/suggest-study-blocks.dto';
import { SchedulingService } from './scheduling.service';

@UseGuards(JwtAuthGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  /** Intervalos livres reais na agenda do usuário (sem sugestão de IA). */
  @Post('free-slots')
  freeSlots(@CurrentUser() user: User, @Body() dto: FreeSlotsDto) {
    return this.schedulingService.getFreeSlots(user.id, dto);
  }

  /** Bloqueio de tempo sugerido por IA: propõe blocos de estudo nos horários livres. */
  @Post('suggest-study-blocks')
  suggestStudyBlocks(@CurrentUser() user: User, @Body() dto: SuggestStudyBlocksDto) {
    return this.schedulingService.suggestStudyBlocks(user.id, dto);
  }

  /** Confirma sugestões, criando os eventos de blocos de estudo na agenda. */
  @Post('accept')
  accept(@CurrentUser() user: User, @Body() dto: AcceptSuggestionsDto) {
    return this.schedulingService.acceptSuggestions(user.id, dto);
  }
}
