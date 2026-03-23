import { Global, Module } from '@nestjs/common';
import { BusinessAccessService } from './business-access.service';
import { CashSessionLookupService } from './cash-session.service';
import { RegisterValidationService } from './register-validation.service';
import { StockService } from './stock.service';

@Global()
@Module({
  providers: [
    BusinessAccessService,
    RegisterValidationService,
    CashSessionLookupService,
    StockService,
  ],
  exports: [
    BusinessAccessService,
    RegisterValidationService,
    CashSessionLookupService,
    StockService,
  ],
})
export class SharedDbModule {}
