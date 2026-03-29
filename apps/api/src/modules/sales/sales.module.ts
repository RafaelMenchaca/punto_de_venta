import { Module } from '@nestjs/common';
import { RefundsController } from './refunds.controller';
import { SalesController } from './sales.controller';
import { SalesRepository } from './sales.repository';
import { SalesService } from './sales.service';

@Module({
  controllers: [SalesController, RefundsController],
  providers: [SalesRepository, SalesService],
})
export class SalesModule {}
