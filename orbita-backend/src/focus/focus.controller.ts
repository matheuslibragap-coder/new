import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StartSessionDto } from './dto/start-session.dto';
import { FocusService } from './focus.service';

@UseGuards(JwtAuthGuard)
@Controller('focus-sessions')
export class FocusController {
  constructor(private readonly focusService: FocusService) {}

  @Post()
  start(@CurrentUser() user: User, @Body() dto: StartSessionDto) {
    return this.focusService.start(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.focusService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.focusService.findOneOrFail(user.id, id);
  }

  @Post(':id/pause')
  pause(@CurrentUser() user: User, @Param('id') id: string) {
    return this.focusService.pause(user.id, id);
  }

  @Post(':id/resume')
  resume(@CurrentUser() user: User, @Param('id') id: string) {
    return this.focusService.resume(user.id, id);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.focusService.complete(user.id, id);
  }

  @Post(':id/abandon')
  abandon(@CurrentUser() user: User, @Param('id') id: string) {
    return this.focusService.abandon(user.id, id);
  }
}
