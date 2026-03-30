import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';

export interface ReportPaymentMethodTotalRecord {
  paymentMethod: string;
  amount: number;
}

export interface SalesReportSummaryRecord {
  totalSales: number;
  salesCount: number;
  averageTicket: number;
}

export interface SalesReportStatusRecord {
  status: string;
  count: number;
  total: number;
}

export interface SalesReportItemRecord {
  id: string;
  status: string;
  paymentStatus: string;
  customerName: string | null;
  cashierName: string | null;
  total: number;
  createdAt: Date;
  paymentMethodsCount: number;
  primaryPaymentMethod: string | null;
}

export interface InventoryValuationReportItemRecord {
  id: string;
  name: string;
  sku: string | null;
  stockTotal: number;
  unitCost: number;
  estimatedValue: number;
  locationName: string | null;
}

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReportSummary(
    filters: {
      businessId: string;
      branchId?: string;
      registerId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<SalesReportSummaryRecord[]>(
      Prisma.sql`
        WITH refund_totals AS (
          SELECT
            sale_id,
            COALESCE(SUM(total), 0)::double precision AS refunded_total
          FROM refunds
          GROUP BY sale_id
        ),
        sale_base AS (
          SELECT
            s.id,
            s.status::text AS status,
            GREATEST(
              s.total - COALESCE(rt.refunded_total, 0),
              0
            )::double precision AS net_total
          FROM sales s
          LEFT JOIN refund_totals rt ON rt.sale_id = s.id
          WHERE s.business_id = CAST(${filters.businessId} AS uuid)
            ${
              filters.branchId
                ? Prisma.sql`AND s.branch_id = CAST(${filters.branchId} AS uuid)`
                : Prisma.empty
            }
            ${
              filters.registerId
                ? Prisma.sql`AND s.register_id = CAST(${filters.registerId} AS uuid)`
                : Prisma.empty
            }
            ${
              filters.dateFrom
                ? Prisma.sql`AND s.created_at >= CAST(${filters.dateFrom} AS date)`
                : Prisma.empty
            }
            ${
              filters.dateTo
                ? Prisma.sql`AND s.created_at < (CAST(${filters.dateTo} AS date) + INTERVAL '1 day')`
                : Prisma.empty
            }
        )
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN status IN ('completed', 'partially_refunded', 'refunded')
                  THEN net_total
                ELSE 0
              END
            ),
            0
          )::double precision AS "totalSales",
          COUNT(*) FILTER (
            WHERE status IN ('completed', 'partially_refunded', 'refunded')
          )::double precision AS "salesCount",
          CASE
            WHEN COUNT(*) FILTER (
              WHERE status IN ('completed', 'partially_refunded', 'refunded')
            ) = 0 THEN 0
            ELSE COALESCE(
              SUM(
                CASE
                  WHEN status IN ('completed', 'partially_refunded', 'refunded')
                    THEN net_total
                  ELSE 0
                END
              ),
              0
            ) / NULLIF(
              COUNT(*) FILTER (
                WHERE status IN ('completed', 'partially_refunded', 'refunded')
              ),
              0
            )
          END::double precision AS "averageTicket"
        FROM sale_base
      `,
    );

    return (
      rows[0] ?? {
        totalSales: 0,
        salesCount: 0,
        averageTicket: 0,
      }
    );
  }

  async getSalesReportPaymentTotals(
    filters: {
      businessId: string;
      branchId?: string;
      registerId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<ReportPaymentMethodTotalRecord[]>(
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
        WHERE s.business_id = CAST(${filters.businessId} AS uuid)
          AND s.status IN (
            CAST('completed' AS sale_status),
            CAST('partially_refunded' AS sale_status),
            CAST('refunded' AS sale_status)
          )
          ${
            filters.branchId
              ? Prisma.sql`AND s.branch_id = CAST(${filters.branchId} AS uuid)`
              : Prisma.empty
          }
          ${
            filters.registerId
              ? Prisma.sql`AND s.register_id = CAST(${filters.registerId} AS uuid)`
              : Prisma.empty
          }
          ${
            filters.dateFrom
              ? Prisma.sql`AND s.created_at >= CAST(${filters.dateFrom} AS date)`
              : Prisma.empty
          }
          ${
            filters.dateTo
              ? Prisma.sql`AND s.created_at < (CAST(${filters.dateTo} AS date) + INTERVAL '1 day')`
              : Prisma.empty
          }
        GROUP BY p.payment_method
      `,
    );
  }

  async getSalesReportStatusBreakdown(
    filters: {
      businessId: string;
      branchId?: string;
      registerId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<SalesReportStatusRecord[]>(
      Prisma.sql`
        WITH refund_totals AS (
          SELECT
            sale_id,
            COALESCE(SUM(total), 0)::double precision AS refunded_total
          FROM refunds
          GROUP BY sale_id
        )
        SELECT
          s.status::text AS status,
          COUNT(*)::double precision AS count,
          COALESCE(
            SUM(
              CASE
                WHEN s.status = CAST('cancelled' AS sale_status) THEN 0
                WHEN s.status = CAST('draft' AS sale_status) THEN 0
                ELSE GREATEST(
                  s.total - COALESCE(rt.refunded_total, 0),
                  0
                )
              END
            ),
            0
          )::double precision AS total
        FROM sales s
        LEFT JOIN refund_totals rt ON rt.sale_id = s.id
        WHERE s.business_id = CAST(${filters.businessId} AS uuid)
          ${
            filters.branchId
              ? Prisma.sql`AND s.branch_id = CAST(${filters.branchId} AS uuid)`
              : Prisma.empty
          }
          ${
            filters.registerId
              ? Prisma.sql`AND s.register_id = CAST(${filters.registerId} AS uuid)`
              : Prisma.empty
          }
          ${
            filters.dateFrom
              ? Prisma.sql`AND s.created_at >= CAST(${filters.dateFrom} AS date)`
              : Prisma.empty
          }
          ${
            filters.dateTo
              ? Prisma.sql`AND s.created_at < (CAST(${filters.dateTo} AS date) + INTERVAL '1 day')`
              : Prisma.empty
          }
        GROUP BY s.status
        ORDER BY s.status ASC
      `,
    );
  }

  async listSalesReportItems(
    filters: {
      businessId: string;
      branchId?: string;
      registerId?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);

    return executor.$queryRaw<SalesReportItemRecord[]>(
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
          s.status::text AS status,
          s.payment_status::text AS "paymentStatus",
          c.full_name AS "customerName",
          p.full_name AS "cashierName",
          CASE
            WHEN s.status = CAST('cancelled' AS sale_status) THEN 0
            ELSE GREATEST(
              s.total - COALESCE(rt.refunded_total, 0),
              0
            )
          END::double precision AS total,
          s.created_at AS "createdAt",
          COALESCE(ps."paymentMethodsCount", 0)::double precision AS "paymentMethodsCount",
          ps."primaryPaymentMethod"
        FROM sales s
        LEFT JOIN customers c ON c.id = s.customer_id
        LEFT JOIN profiles p ON p.id = s.sold_by
        LEFT JOIN refund_totals rt ON rt.sale_id = s.id
        LEFT JOIN payment_summary ps ON ps.sale_id = s.id
        WHERE s.business_id = CAST(${filters.businessId} AS uuid)
          AND s.status <> CAST('draft' AS sale_status)
          ${
            filters.branchId
              ? Prisma.sql`AND s.branch_id = CAST(${filters.branchId} AS uuid)`
              : Prisma.empty
          }
          ${
            filters.registerId
              ? Prisma.sql`AND s.register_id = CAST(${filters.registerId} AS uuid)`
              : Prisma.empty
          }
          ${
            filters.dateFrom
              ? Prisma.sql`AND s.created_at >= CAST(${filters.dateFrom} AS date)`
              : Prisma.empty
          }
          ${
            filters.dateTo
              ? Prisma.sql`AND s.created_at < (CAST(${filters.dateTo} AS date) + INTERVAL '1 day')`
              : Prisma.empty
          }
        ORDER BY s.created_at DESC, s.id DESC
        LIMIT CAST(${limit} AS integer)
      `,
    );
  }

  async listInventoryValuation(
    filters: {
      businessId: string;
      branchId?: string;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<InventoryValuationReportItemRecord[]>(
      Prisma.sql`
        SELECT
          p.id,
          p.name,
          p.sku,
          COALESCE(SUM(sb.quantity - sb.reserved_quantity), 0)::double precision AS "stockTotal",
          COALESCE(p.cost_price, 0)::double precision AS "unitCost",
          (
            COALESCE(SUM(sb.quantity - sb.reserved_quantity), 0)
            * COALESCE(p.cost_price, 0)
          )::double precision AS "estimatedValue",
          NULL::text AS "locationName"
        FROM products p
        LEFT JOIN stock_balances sb
          ON sb.product_id = p.id
          AND sb.business_id = CAST(${filters.businessId} AS uuid)
          ${
            filters.branchId
              ? Prisma.sql`AND sb.branch_id = CAST(${filters.branchId} AS uuid)`
              : Prisma.empty
          }
        WHERE p.business_id = CAST(${filters.businessId} AS uuid)
          AND COALESCE(p.track_inventory, false) = true
          AND COALESCE(p.is_active, true) = true
        GROUP BY p.id, p.name, p.sku, p.cost_price
        HAVING COALESCE(SUM(sb.quantity - sb.reserved_quantity), 0) > 0
        ORDER BY "estimatedValue" DESC, p.name ASC
      `,
    );
  }
}
