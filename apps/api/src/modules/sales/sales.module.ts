import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesRepository } from './sales.repository';
import { SalesService } from './sales.service';

@Module({
  controllers: [SalesController],
  providers: [SalesRepository, SalesService],
})
export class SalesModule {}
