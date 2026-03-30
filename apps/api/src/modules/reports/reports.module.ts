import { Module } from '@nestjs/common';
import { CashRepository } from '../cash/cash.repository';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController],
  providers: [CashRepository, ReportsRepository, ReportsService],
})
export class ReportsModule {}
