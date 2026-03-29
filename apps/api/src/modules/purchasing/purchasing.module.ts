import { Module } from '@nestjs/common';
import { PurchasingController } from './purchasing.controller';
import { PurchasingRepository } from './purchasing.repository';
import { PurchasingService } from './purchasing.service';

@Module({
  controllers: [PurchasingController],
  providers: [PurchasingRepository, PurchasingService],
})
export class PurchasingModule {}
