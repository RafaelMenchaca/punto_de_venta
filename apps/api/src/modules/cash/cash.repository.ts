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
  closingExpected: number | null;
  closingCounted: number | null;
  differenceAmount: number | null;
  status: string;
  openedBy: string | null;
  openedAt: Date;
  closedBy: string | null;
  closedAt: Date | null;
  notes: string | null;
}

export interface CashSessionDetailRecord extends CashSessionRecord {
  businessName: string;
  branchName: string;
  registerName: string;
  registerCode: string;
  openedByName: string | null;
  closedByName: string | null;
}

export interface CashMovementRecord {
  id: string;
  cashSessionId: string;
  movementType: string;
  amount: number;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
}

export interface PaymentMethodTotalRecord {
  paymentMethod: string;
  amount: number;
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
          CAST(${input.businessId} AS uuid),
          CAST(${input.branchId} AS uuid),
          CAST(${input.registerId} AS uuid),
          CAST(${input.openedBy} AS uuid),
          ${input.openingAmount},
          CAST(${CashSessionStatus.OPEN} AS cash_session_status),
          ${input.notes ?? null},
          NOW()
        )
        RETURNING
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          register_id AS "registerId",
          opening_amount::double precision AS "openingAmount",
          closing_expected::double precision AS "closingExpected",
          closing_counted::double precision AS "closingCounted",
          difference_amount::double precision AS "differenceAmount",
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

  async getCashSessionById(cashSessionId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<CashSessionDetailRecord[]>(
      Prisma.sql`
        SELECT
          cs.id,
          cs.business_id AS "businessId",
          b.name AS "businessName",
          cs.branch_id AS "branchId",
          br.name AS "branchName",
          cs.register_id AS "registerId",
          r.name AS "registerName",
          r.code AS "registerCode",
          cs.opening_amount::double precision AS "openingAmount",
          cs.closing_expected::double precision AS "closingExpected",
          cs.closing_counted::double precision AS "closingCounted",
          cs.difference_amount::double precision AS "differenceAmount",
          cs.status,
          cs.opened_by AS "openedBy",
          op.full_name AS "openedByName",
          cs.opened_at AS "openedAt",
          cs.closed_by AS "closedBy",
          cp.full_name AS "closedByName",
          cs.closed_at AS "closedAt",
          cs.notes
        FROM cash_sessions cs
        INNER JOIN businesses b ON b.id = cs.business_id
        INNER JOIN branches br ON br.id = cs.branch_id
        INNER JOIN registers r ON r.id = cs.register_id
        LEFT JOIN profiles op ON op.id = cs.opened_by
        LEFT JOIN profiles cp ON cp.id = cs.closed_by
        WHERE cs.id = CAST(${cashSessionId} AS uuid)
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async getOpenCashSessionByIdForUpdate(
    cashSessionId: string,
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<CashSessionDetailRecord[]>(
      Prisma.sql`
        SELECT
          cs.id,
          cs.business_id AS "businessId",
          b.name AS "businessName",
          cs.branch_id AS "branchId",
          br.name AS "branchName",
          cs.register_id AS "registerId",
          r.name AS "registerName",
          r.code AS "registerCode",
          cs.opening_amount::double precision AS "openingAmount",
          cs.closing_expected::double precision AS "closingExpected",
          cs.closing_counted::double precision AS "closingCounted",
          cs.difference_amount::double precision AS "differenceAmount",
          cs.status,
          cs.opened_by AS "openedBy",
          NULL::text AS "openedByName",
          cs.opened_at AS "openedAt",
          cs.closed_by AS "closedBy",
          NULL::text AS "closedByName",
          cs.closed_at AS "closedAt",
          cs.notes
        FROM cash_sessions cs
        INNER JOIN businesses b ON b.id = cs.business_id
        INNER JOIN branches br ON br.id = cs.branch_id
        INNER JOIN registers r ON r.id = cs.register_id
        WHERE cs.id = CAST(${cashSessionId} AS uuid)
          AND cs.status = CAST(${CashSessionStatus.OPEN} AS cash_session_status)
        FOR UPDATE OF cs
      `,
    );

    return rows[0] ?? null;
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
          closed_by = CAST(${input.closedBy} AS uuid),
          closed_at = NOW(),
          closing_expected = ${input.closingExpected},
          closing_counted = ${input.closingCounted},
          difference_amount = ${input.differenceAmount},
          status = CAST(${CashSessionStatus.CLOSED} AS cash_session_status),
          notes = ${input.notes ?? null},
          updated_at = NOW()
        WHERE id = CAST(${input.cashSessionId} AS uuid)
        RETURNING
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          register_id AS "registerId",
          opening_amount::double precision AS "openingAmount",
          closing_expected::double precision AS "closingExpected",
          closing_counted::double precision AS "closingCounted",
          difference_amount::double precision AS "differenceAmount",
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

  async createCashMovement(
    input: {
      businessId: string;
      branchId: string;
      cashSessionId: string;
      movementType: string;
      amount: number;
      notes?: string | null;
      createdBy: string;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<CashMovementRecord[]>(
      Prisma.sql`
        INSERT INTO cash_movements (
          business_id,
          branch_id,
          cash_session_id,
          movement_type,
          amount,
          notes,
          created_by,
          created_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          CAST(${input.branchId} AS uuid),
          CAST(${input.cashSessionId} AS uuid),
          ${input.movementType},
          ${input.amount},
          ${input.notes ?? null},
          CAST(${input.createdBy} AS uuid),
          NOW()
        )
        RETURNING
          id,
          cash_session_id AS "cashSessionId",
          movement_type AS "movementType",
          amount::double precision AS amount,
          notes,
          created_by AS "createdBy",
          NOW() AS "createdAt",
          NULL::text AS "createdByName"
      `,
    );

    return rows[0]!;
  }

  async getCashMovements(cashSessionId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    return executor.$queryRaw<CashMovementRecord[]>(
      Prisma.sql`
        SELECT
          cm.id,
          cm.cash_session_id AS "cashSessionId",
          cm.movement_type AS "movementType",
          cm.amount::double precision AS amount,
          cm.notes,
          cm.created_by AS "createdBy",
          p.full_name AS "createdByName",
          cm.created_at AS "createdAt"
        FROM cash_movements cm
        LEFT JOIN profiles p ON p.id = cm.created_by
        WHERE cm.cash_session_id = CAST(${cashSessionId} AS uuid)
        ORDER BY cm.created_at DESC
      `,
    );
  }

  async getPaymentTotalsByMethod(cashSessionId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    return executor.$queryRaw<PaymentMethodTotalRecord[]>(
      Prisma.sql`
        WITH refund_totals AS (
          SELECT
            sale_id,
            COALESCE(SUM(total), 0)::double precision AS refunded_total
          FROM refunds
          GROUP BY sale_id
        )
        SELECT
          p.payment_method::text AS "paymentMethod",
          COALESCE(
            SUM(
              CASE
                WHEN s.total <= 0 THEN 0
                ELSE p.amount * GREATEST(
                  1 - (COALESCE(rt.refunded_total, 0) / NULLIF(s.total, 0)),
                  0
                )
              END
            ),
            0
          )::double precision AS amount
        FROM sales s
        INNER JOIN payments p ON p.sale_id = s.id
        LEFT JOIN refund_totals rt ON rt.sale_id = s.id
        WHERE s.cash_session_id = CAST(${cashSessionId} AS uuid)
          AND s.status IN (
            CAST('completed' AS sale_status),
            CAST('partially_refunded' AS sale_status),
            CAST('refunded' AS sale_status)
          )
        GROUP BY p.payment_method
      `,
    );
  }

  async getSalesTotal(cashSessionId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<Array<{ totalSales: number }>>(
      Prisma.sql`
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN s.status = CAST('cancelled' AS sale_status) THEN 0
                ELSE GREATEST(
                  s.total - COALESCE(refund_totals.amount, 0),
                  0
                )
              END
            ),
            0
          )::double precision AS "totalSales"
        FROM sales s
        LEFT JOIN (
          SELECT
            sale_id,
            SUM(total) AS amount
          FROM refunds
          GROUP BY sale_id
        ) refund_totals ON refund_totals.sale_id = s.id
        WHERE s.cash_session_id = CAST(${cashSessionId} AS uuid)
          AND s.status <> CAST('draft' AS sale_status)
      `,
    );

    return rows[0]?.totalSales ?? 0;
  }
}
