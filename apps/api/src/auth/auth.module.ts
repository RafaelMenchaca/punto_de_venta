import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseJwtService } from './supabase-jwt.service';

@Module({
  providers: [
    SupabaseJwtService,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
  exports: [SupabaseJwtService],
})
export class AuthModule {}
