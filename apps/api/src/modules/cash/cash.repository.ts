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

export interface CashSessionSalesOverviewRecord {
  salesTotal: number;
  salesCount: number;
}

export interface CashSessionSalePreviewRecord {
  id: string;
  total: number;
  createdAt: Date;
  customerName: string | null;
  paymentMethodsCount: number;
  primaryPaymentMethod: string | null;
}

export interface CashSessionListRecord extends CashSessionDetailRecord {
  salesTotal: number;
  salesCount: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  mixedTotal: number;
  storeCreditTotal: number;
  manualIncomeTotal: number;
  manualExpenseTotal: number;
  expectedCash: number;
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

  async getCashSessionSalesOverview(
    cashSessionId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<CashSessionSalesOverviewRecord[]>(
      Prisma.sql`
        SELECT
          COUNT(*) FILTER (
            WHERE s.status <> CAST('draft' AS sale_status)
              AND s.status <> CAST('cancelled' AS sale_status)
          )::double precision AS "salesCount",
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
          )::double precision AS "salesTotal"
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

    return (
      rows[0] ?? {
        salesTotal: 0,
        salesCount: 0,
      }
    );
  }

  async getCashSessionSalesPreview(
    cashSessionId: string,
    limit = 20,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const normalizedLimit = Math.min(Math.max(limit, 1), 50);

    return executor.$queryRaw<CashSessionSalePreviewRecord[]>(
      Prisma.sql`
        WITH refund_totals AS (
          SELECT
            sale_id,
            COALESCE(SUM(total), 0)::double precision AS refunded_total
          FROM refunds
          GROUP BY sale_id
        ),
        payment_summary AS (
          SELECT
            sale_id,
            COUNT(DISTINCT payment_method)::double precision AS "paymentMethodsCount",
            MIN(payment_method)::text AS "primaryPaymentMethod"
          FROM payments
          GROUP BY sale_id
        )
        SELECT
          s.id,
          GREATEST(
            s.total - COALESCE(rt.refunded_total, 0),
            0
          )::double precision AS total,
          s.created_at AS "createdAt",
          c.full_name AS "customerName",
          COALESCE(ps."paymentMethodsCount", 0)::double precision AS "paymentMethodsCount",
          ps."primaryPaymentMethod"
        FROM sales s
        LEFT JOIN refund_totals rt ON rt.sale_id = s.id
        LEFT JOIN payment_summary ps ON ps.sale_id = s.id
        LEFT JOIN customers c ON c.id = s.customer_id
        WHERE s.cash_session_id = CAST(${cashSessionId} AS uuid)
          AND s.status <> CAST('draft' AS sale_status)
          AND s.status <> CAST('cancelled' AS sale_status)
        ORDER BY s.created_at DESC, s.id DESC
        LIMIT CAST(${normalizedLimit} AS integer)
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

  async listCashSessions(
    businessId: string,
    filters?: {
      branchId?: string;
      registerId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 100);

    return executor.$queryRaw<CashSessionListRecord[]>(
      Prisma.sql`
        WITH refund_totals AS (
          SELECT
            sale_id,
            COALESCE(SUM(total), 0)::double precision AS refunded_total
          FROM refunds
          GROUP BY sale_id
        ),
        sales_totals AS (
          SELECT
            s.cash_session_id AS "cashSessionId",
            COUNT(*) FILTER (
              WHERE s.status <> CAST('draft' AS sale_status)
                AND s.status <> CAST('cancelled' AS sale_status)
            )::double precision AS "salesCount",
            COALESCE(
              SUM(
                CASE
                  WHEN s.status = CAST('cancelled' AS sale_status) THEN 0
                  ELSE GREATEST(
                    s.total - COALESCE(rt.refunded_total, 0),
                    0
                  )
                END
              ),
              0
            )::double precision AS "salesTotal"
          FROM sales s
          LEFT JOIN refund_totals rt ON rt.sale_id = s.id
          WHERE s.business_id = CAST(${businessId} AS uuid)
          GROUP BY s.cash_session_id
        ),
        payment_totals AS (
          SELECT
            s.cash_session_id AS "cashSessionId",
            COALESCE(
              SUM(
                CASE
                  WHEN p.payment_method = CAST('cash' AS payment_method) THEN
                    CASE
                      WHEN s.total <= 0 THEN 0
                      ELSE p.amount * GREATEST(
                        1 - (COALESCE(rt.refunded_total, 0) / NULLIF(s.total, 0)),
                        0
                      )
                    END
                  ELSE 0
                END
              ),
              0
            )::double precision AS "cashTotal",
            COALESCE(
              SUM(
                CASE
                  WHEN p.payment_method = CAST('card' AS payment_method) THEN
                    CASE
                      WHEN s.total <= 0 THEN 0
                      ELSE p.amount * GREATEST(
                        1 - (COALESCE(rt.refunded_total, 0) / NULLIF(s.total, 0)),
                        0
                      )
                    END
                  ELSE 0
                END
              ),
              0
            )::double precision AS "cardTotal",
            COALESCE(
              SUM(
                CASE
                  WHEN p.payment_method = CAST('transfer' AS payment_method) THEN
                    CASE
                      WHEN s.total <= 0 THEN 0
                      ELSE p.amount * GREATEST(
                        1 - (COALESCE(rt.refunded_total, 0) / NULLIF(s.total, 0)),
                        0
                      )
                    END
                  ELSE 0
                END
              ),
              0
            )::double precision AS "transferTotal",
            COALESCE(
              SUM(
                CASE
                  WHEN p.payment_method = CAST('mixed' AS payment_method) THEN
                    CASE
                      WHEN s.total <= 0 THEN 0
                      ELSE p.amount * GREATEST(
                        1 - (COALESCE(rt.refunded_total, 0) / NULLIF(s.total, 0)),
                        0
                      )
                    END
                  ELSE 0
                END
              ),
              0
            )::double precision AS "mixedTotal",
            COALESCE(
              SUM(
                CASE
                  WHEN p.payment_method = CAST('store_credit' AS payment_method) THEN
                    CASE
                      WHEN s.total <= 0 THEN 0
                      ELSE p.amount * GREATEST(
                        1 - (COALESCE(rt.refunded_total, 0) / NULLIF(s.total, 0)),
                        0
                      )
                    END
                  ELSE 0
                END
              ),
              0
            )::double precision AS "storeCreditTotal"
          FROM sales s
          INNER JOIN payments p ON p.sale_id = s.id
          LEFT JOIN refund_totals rt ON rt.sale_id = s.id
          WHERE s.business_id = CAST(${businessId} AS uuid)
            AND s.status IN (
              CAST('completed' AS sale_status),
              CAST('partially_refunded' AS sale_status),
              CAST('refunded' AS sale_status)
            )
          GROUP BY s.cash_session_id
        ),
        movement_totals AS (
          SELECT
            cm.cash_session_id AS "cashSessionId",
            COALESCE(
              SUM(CASE WHEN cm.movement_type = 'income' THEN cm.amount ELSE 0 END),
              0
            )::double precision AS "manualIncomeTotal",
            COALESCE(
              SUM(CASE WHEN cm.movement_type = 'expense' THEN cm.amount ELSE 0 END),
              0
            )::double precision AS "manualExpenseTotal"
          FROM cash_movements cm
          WHERE cm.business_id = CAST(${businessId} AS uuid)
          GROUP BY cm.cash_session_id
        )
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
          cs.notes,
          COALESCE(st."salesTotal", 0)::double precision AS "salesTotal",
          COALESCE(st."salesCount", 0)::double precision AS "salesCount",
          COALESCE(pt."cashTotal", 0)::double precision AS "cashTotal",
          COALESCE(pt."cardTotal", 0)::double precision AS "cardTotal",
          COALESCE(pt."transferTotal", 0)::double precision AS "transferTotal",
          COALESCE(pt."mixedTotal", 0)::double precision AS "mixedTotal",
          COALESCE(pt."storeCreditTotal", 0)::double precision AS "storeCreditTotal",
          COALESCE(mt."manualIncomeTotal", 0)::double precision AS "manualIncomeTotal",
          COALESCE(mt."manualExpenseTotal", 0)::double precision AS "manualExpenseTotal",
          (
            COALESCE(cs.opening_amount, 0)
            + COALESCE(pt."cashTotal", 0)
            + COALESCE(mt."manualIncomeTotal", 0)
            - COALESCE(mt."manualExpenseTotal", 0)
          )::double precision AS "expectedCash"
        FROM cash_sessions cs
        INNER JOIN businesses b ON b.id = cs.business_id
        INNER JOIN branches br ON br.id = cs.branch_id
        INNER JOIN registers r ON r.id = cs.register_id
        LEFT JOIN profiles op ON op.id = cs.opened_by
        LEFT JOIN profiles cp ON cp.id = cs.closed_by
        LEFT JOIN sales_totals st ON st."cashSessionId" = cs.id
        LEFT JOIN payment_totals pt ON pt."cashSessionId" = cs.id
        LEFT JOIN movement_totals mt ON mt."cashSessionId" = cs.id
        WHERE cs.business_id = CAST(${businessId} AS uuid)
          ${
            filters?.branchId
              ? Prisma.sql`AND cs.branch_id = CAST(${filters.branchId} AS uuid)`
              : Prisma.empty
          }
          ${
            filters?.registerId
              ? Prisma.sql`AND cs.register_id = CAST(${filters.registerId} AS uuid)`
              : Prisma.empty
          }
          ${
            filters?.status
              ? Prisma.sql`AND cs.status = CAST(${filters.status} AS cash_session_status)`
              : Prisma.empty
          }
          ${
            filters?.dateFrom
              ? Prisma.sql`AND cs.opened_at >= CAST(${filters.dateFrom} AS date)`
              : Prisma.empty
          }
          ${
            filters?.dateTo
              ? Prisma.sql`AND cs.opened_at < (CAST(${filters.dateTo} AS date) + INTERVAL '1 day')`
              : Prisma.empty
          }
        ORDER BY cs.opened_at DESC, cs.id DESC
        LIMIT CAST(${limit} AS integer)
      `,
    );
  }
}
