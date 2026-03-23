import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  private extractDatabaseHost() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return null;
    }

    try {
      return new URL(databaseUrl).hostname;
    } catch {
      return null;
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      const host = this.extractDatabaseHost();
      const message = error instanceof Error ? error.message : String(error);

      if (
        host?.endsWith('.supabase.co') &&
        host.startsWith('db.') &&
        message.includes("Can't reach database server")
      ) {
        this.logger.error(
          [
            `No se pudo conectar al host directo de Supabase: ${host}.`,
            'Ese host suele requerir IPv6.',
            'Si estas en una red IPv4, cambia DATABASE_URL a la cadena "Session pooler" de Supabase (host *.pooler.supabase.com, puerto 5432).',
          ].join(' '),
        );
      }

      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
