import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditLogInput {
  businessId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  tx?: PrismaExecutor;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(input: AuditLogInput) {
    const executor = input.tx ?? this.prisma;

    await executor.$executeRaw(
      Prisma.sql`
        INSERT INTO audit_logs (
          business_id,
          actor_user_id,
          action,
          entity_type,
          entity_id,
          before_json,
          after_json,
          created_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          CAST(${input.actorUserId} AS uuid),
          ${input.action},
          ${input.entityType},
          CAST(${input.entityId} AS uuid),
          CAST(${input.beforeJson ? JSON.stringify(input.beforeJson) : null} AS jsonb),
          CAST(${input.afterJson ? JSON.stringify(input.afterJson) : null} AS jsonb),
          NOW()
        )
      `,
    );
  }
}
