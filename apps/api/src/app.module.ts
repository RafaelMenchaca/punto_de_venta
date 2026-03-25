import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { CashModule } from './modules/cash/cash.module';
import { ContextModule } from './modules/context/context.module';
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { SharedDbModule } from './modules/shared-db/shared-db.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    SharedDbModule,
    AuditModule,
    ContextModule,
    HealthModule,
    CashModule,
    SalesModule,
    InventoryModule,
  ],
})
export class AppModule {}
