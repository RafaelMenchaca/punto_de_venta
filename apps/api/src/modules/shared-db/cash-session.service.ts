import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { CashSessionStatus } from '../../common/enums/cash-session-status.enum';
import { PrismaService } from '../../prisma/prisma.service';

export interface OpenCashSessionRecord {
  id: string;
  businessId: string;
  branchId: string;
  registerId: string;
  openingAmount: number;
  status: string;
  openedBy: string;
  openedAt: Date;
  notes: string | null;
}

@Injectable()
export class CashSessionLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async getOpenCashSessionByRegister(registerId: string) {
    const rows = await this.prisma.$queryRaw<OpenCashSessionRecord[]>(
      Prisma.sql`
        SELECT
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          register_id AS "registerId",
          opening_amount::double precision AS "openingAmount",
          status,
          opened_by AS "openedBy",
          opened_at AS "openedAt",
          notes
        FROM cash_sessions
        WHERE register_id = CAST(${registerId} AS uuid)
          AND status = CAST(${CashSessionStatus.OPEN} AS cash_session_status)
        ORDER BY opened_at DESC
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async assertOpenCashSessionById(cashSessionId: string) {
    const rows = await this.prisma.$queryRaw<OpenCashSessionRecord[]>(
      Prisma.sql`
        SELECT
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          register_id AS "registerId",
          opening_amount::double precision AS "openingAmount",
          status,
          opened_by AS "openedBy",
          opened_at AS "openedAt",
          notes
        FROM cash_sessions
        WHERE id = CAST(${cashSessionId} AS uuid)
          AND status = CAST(${CashSessionStatus.OPEN} AS cash_session_status)
        LIMIT 1
      `,
    );

    if (rows.length === 0) {
      throw new NotFoundException('La sesión de caja abierta no existe.');
    }

    return rows[0]!;
  }
}
