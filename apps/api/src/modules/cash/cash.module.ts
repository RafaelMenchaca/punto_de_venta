import { Module } from '@nestjs/common';
import { CashController } from './cash.controller';
import { CashRepository } from './cash.repository';
import { CashSessionSummaryService } from './cash-session-summary.service';
import { CashService } from './cash.service';

@Module({
  controllers: [CashController],
  providers: [CashRepository, CashSessionSummaryService, CashService],
})
export class CashModule {}
