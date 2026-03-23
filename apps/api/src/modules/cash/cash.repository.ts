import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { CashSessionStatus } from '../../common/enums/cash-session-status.enum';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';

export interface CashSessionRecord {
  id: string;
  businessId: string;
  branchId: string;
  registerId: string;
  openingAmount: number;
  status: string;
  openedBy: string;
  openedAt: Date;
  closedBy: string | null;
  closedAt: Date | null;
  notes: string | null;
}

export interface CashCloseTotals {
  openingAmount: number;
  cashMovementNet: number;
  cashSalesTotal: number;
}

@Injectable()
export class CashRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCashSession(
    input: {
      businessId: string;
      branchId: string;
      registerId: string;
      openingAmount: number;
      openedBy: string;
      notes?: string | null;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<CashSessionRecord[]>(
      Prisma.sql`
        INSERT INTO cash_sessions (
          business_id,
          branch_id,
          register_id,
          opened_by,
          opening_amount,
          status,
          notes,
          opened_at
        )
        VALUES (
          ${input.businessId},
          ${input.branchId},
          ${input.registerId},
          ${input.openedBy},
          ${input.openingAmount},
          ${CashSessionStatus.OPEN},
          ${input.notes ?? null},
          NOW()
        )
        RETURNING
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          register_id AS "registerId",
          opening_amount::double precision AS "openingAmount",
          status,
          opened_by AS "openedBy",
          opened_at AS "openedAt",
          closed_by AS "closedBy",
          closed_at AS "closedAt",
          notes
      `,
    );

    return rows[0]!;
  }

  async calculateCloseTotals(cashSessionId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<CashCloseTotals[]>(
      Prisma.sql`
        SELECT
          cs.opening_amount::double precision AS "openingAmount",
          COALESCE(cm.amounts, 0)::double precision AS "cashMovementNet",
          COALESCE(cp.amounts, 0)::double precision AS "cashSalesTotal"
        FROM cash_sessions cs
        LEFT JOIN (
          SELECT
            cash_session_id,
            SUM(amount) AS amounts
          FROM cash_movements
          WHERE cash_session_id = ${cashSessionId}
          GROUP BY cash_session_id
        ) cm ON cm.cash_session_id = cs.id
        LEFT JOIN (
          SELECT
            s.cash_session_id,
            SUM(p.amount) AS amounts
          FROM sales s
          INNER JOIN payments p ON p.sale_id = s.id
          WHERE s.cash_session_id = ${cashSessionId}
            AND p.payment_method = 'cash'
          GROUP BY s.cash_session_id
        ) cp ON cp.cash_session_id = cs.id
        WHERE cs.id = ${cashSessionId}
        LIMIT 1
      `,
    );

    return rows[0]!;
  }

  async closeCashSession(
    input: {
      cashSessionId: string;
      closedBy: string;
      closingExpected: number;
      closingCounted: number;
      differenceAmount: number;
      notes?: string | null;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<CashSessionRecord[]>(
      Prisma.sql`
        UPDATE cash_sessions
        SET
          closed_by = ${input.closedBy},
          closed_at = NOW(),
          closing_expected = ${input.closingExpected},
          closing_counted = ${input.closingCounted},
          difference_amount = ${input.differenceAmount},
          status = ${CashSessionStatus.CLOSED},
          notes = ${input.notes ?? null}
        WHERE id = ${input.cashSessionId}
        RETURNING
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          register_id AS "registerId",
          opening_amount::double precision AS "openingAmount",
          status,
          opened_by AS "openedBy",
          opened_at AS "openedAt",
          closed_by AS "closedBy",
          closed_at AS "closedAt",
          notes
      `,
    );

    return rows[0]!;
  }
}
