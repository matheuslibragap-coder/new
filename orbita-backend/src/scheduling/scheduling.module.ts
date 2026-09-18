import { Module } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService, ClaudeService],
})
export class SchedulingModule {}
