import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { SaleStatus } from '../../common/enums/sale-status.enum';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';

export interface SaleProductRecord {
  id: string;
  businessId: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  unitCost: number;
  trackInventory: boolean;
  taxRate: number;
}

export interface CustomerReferenceRecord {
  id: string;
  businessId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export interface StockBalanceLockRecord {
  productId: string;
  quantity: number;
}

export interface SaleRecord {
  id: string;
  businessId: string;
  branchId: string;
  registerId: string;
  cashSessionId: string | null;
  customerId: string | null;
  soldBy: string | null;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleDetailRecord extends SaleRecord {
  businessName: string;
  branchName: string;
  registerName: string | null;
  registerCode: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  soldByName: string | null;
  refundedTotal: number;
}

export interface SaleListRecord extends SaleRecord {
  customerName: string | null;
  soldByName: string | null;
  refundedTotal: number;
}

export interface SaleItemRecord {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxTotal: number;
  discountTotal: number;
  productNameSnapshot: string;
  skuSnapshot: string | null;
  unitCostSnapshot: number;
  refundedQuantity: number;
  remainingQuantity: number;
  trackInventory: boolean;
}

export interface PaymentRecord {
  id: string;
  saleId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  reference: string | null;
  paidAt: Date;
}

export interface RefundRecord {
  id: string;
  businessId: string;
  branchId: string;
  saleId: string;
  refundedBy: string | null;
  refundedByName: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  reason: string | null;
  createdAt: Date;
}

export interface RefundItemRecord {
  id: string;
  refundId: string;
  saleItemId: string;
  quantity: number;
  amount: number;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string | null;
}

export interface SaleInventoryReturnTargetRecord {
  productId: string;
  locationId: string;
  quantity: number;
  unitCost: number;
}

@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProductsForSale(
    businessId: string,
    productIds: string[],
    tx?: PrismaExecutor,
  ) {
    if (productIds.length === 0) {
      return [];
    }

    const executor = tx ?? this.prisma;
    const productIdList = productIds.map(
      (productId) => Prisma.sql`CAST(${productId} AS uuid)`,
    );

    return executor.$queryRaw<SaleProductRecord[]>(Prisma.sql`
      SELECT
        p.id,
        p.business_id AS "businessId",
        p.name,
        p.sku,
        COALESCE(p.sale_price, 0)::double precision AS "unitPrice",
        COALESCE(p.cost_price, 0)::double precision AS "unitCost",
        COALESCE(p.track_inventory, false) AS "trackInventory",
        COALESCE(tr.rate, 0)::double precision AS "taxRate"
      FROM products p
      LEFT JOIN tax_rates tr ON tr.id = p.tax_rate_id
      WHERE p.business_id = CAST(${businessId} AS uuid)
        AND p.id IN (${Prisma.join(productIdList)})
        AND COALESCE(p.is_active, true) = true
    `);
  }

  async getCustomerById(
    businessId: string,
    customerId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<CustomerReferenceRecord[]>(Prisma.sql`
      SELECT
        id,
        business_id AS "businessId",
        full_name AS "fullName",
        email,
        phone,
        notes
      FROM customers
      WHERE business_id = CAST(${businessId} AS uuid)
        AND id = CAST(${customerId} AS uuid)
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async lockStockBalance(
    businessId: string,
    branchId: string,
    locationId: string,
    productId: string,
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<StockBalanceLockRecord[]>(Prisma.sql`
      SELECT
        product_id AS "productId",
        (quantity - reserved_quantity)::double precision AS quantity
      FROM stock_balances
      WHERE business_id = CAST(${businessId} AS uuid)
        AND branch_id = CAST(${branchId} AS uuid)
        AND location_id = CAST(${locationId} AS uuid)
        AND product_id = CAST(${productId} AS uuid)
      FOR UPDATE
    `);

    return rows[0] ?? null;
  }

  async createSaleHeader(
    input: {
      businessId: string;
      branchId: string;
      registerId: string;
      cashSessionId: string;
      customerId?: string | null;
      status: string;
      paymentStatus: string;
      subtotal: number;
      discountTotal: number;
      taxTotal: number;
      total: number;
      notes?: string | null;
      soldBy: string;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<SaleRecord[]>(Prisma.sql`
      INSERT INTO sales (
        business_id,
        branch_id,
        register_id,
        cash_session_id,
        customer_id,
        sold_by,
        subtotal,
        discount_total,
        tax_total,
        total,
        status,
        payment_status,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        CAST(${input.businessId} AS uuid),
        CAST(${input.branchId} AS uuid),
        CAST(${input.registerId} AS uuid),
        CAST(${input.cashSessionId} AS uuid),
        CAST(${input.customerId ?? null} AS uuid),
        CAST(${input.soldBy} AS uuid),
        ${input.subtotal},
        ${input.discountTotal},
        ${input.taxTotal},
        ${input.total},
        CAST(${input.status} AS sale_status),
        CAST(${input.paymentStatus} AS payment_status),
        ${input.notes ?? null},
        NOW(),
        NOW()
      )
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        register_id AS "registerId",
        cash_session_id AS "cashSessionId",
        customer_id AS "customerId",
        sold_by AS "soldBy",
        status,
        payment_status AS "paymentStatus",
        subtotal::double precision AS subtotal,
        discount_total::double precision AS "discountTotal",
        tax_total::double precision AS "taxTotal",
        total::double precision AS total,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0]!;
  }

  async createSaleItem(
    input: {
      saleId: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      taxTotal: number;
      discountTotal: number;
      productNameSnapshot: string;
      skuSnapshot: string | null;
      unitCostSnapshot: number;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<SaleItemRecord[]>(Prisma.sql`
      INSERT INTO sale_items (
        sale_id,
        product_id,
        product_name_snapshot,
        sku_snapshot,
        quantity,
        unit_price,
        unit_cost_snapshot,
        discount_total,
        tax_total,
        line_total
      )
      VALUES (
        CAST(${input.saleId} AS uuid),
        CAST(${input.productId} AS uuid),
        ${input.productNameSnapshot},
        ${input.skuSnapshot},
        ${input.quantity},
        ${input.unitPrice},
        ${input.unitCostSnapshot},
        ${input.discountTotal},
        ${input.taxTotal},
        ${input.lineTotal}
      )
      RETURNING
        id,
        sale_id AS "saleId",
        product_id AS "productId",
        quantity::double precision AS quantity,
        unit_price::double precision AS "unitPrice",
        line_total::double precision AS "lineTotal",
        tax_total::double precision AS "taxTotal",
        discount_total::double precision AS "discountTotal",
        product_name_snapshot AS "productNameSnapshot",
        sku_snapshot AS "skuSnapshot",
        unit_cost_snapshot::double precision AS "unitCostSnapshot",
        0::double precision AS "refundedQuantity",
        quantity::double precision AS "remainingQuantity",
        false AS "trackInventory"
    `);

    return rows[0]!;
  }

  async createPayment(
    input: {
      saleId: string;
      paymentMethod: string;
      amount: number;
      reference?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<PaymentRecord[]>(Prisma.sql`
      INSERT INTO payments (
        sale_id,
        payment_method,
        amount,
        reference,
        paid_at
      )
      VALUES (
        CAST(${input.saleId} AS uuid),
        CAST(${input.paymentMethod} AS payment_method),
        ${input.amount},
        ${input.reference ?? null},
        NOW()
      )
      RETURNING
        id,
        sale_id AS "saleId",
        payment_method AS "paymentMethod",
        amount::double precision AS amount,
        reference,
        paid_at AS "paidAt"
    `);

    return rows[0]!;
  }

  async getSaleForUpdate(saleId: string, tx: PrismaExecutor) {
    const rows = await tx.$queryRaw<SaleRecord[]>(Prisma.sql`
      SELECT
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        register_id AS "registerId",
        cash_session_id AS "cashSessionId",
        customer_id AS "customerId",
        sold_by AS "soldBy",
        status,
        payment_status AS "paymentStatus",
        subtotal::double precision AS subtotal,
        discount_total::double precision AS "discountTotal",
        tax_total::double precision AS "taxTotal",
        total::double precision AS total,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM sales
      WHERE id = CAST(${saleId} AS uuid)
      FOR UPDATE
    `);

    return rows[0] ?? null;
  }

  async getSaleDetail(saleId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<SaleDetailRecord[]>(Prisma.sql`
      SELECT
        s.id,
        s.business_id AS "businessId",
        b.name AS "businessName",
        s.branch_id AS "branchId",
        br.name AS "branchName",
        s.register_id AS "registerId",
        r.name AS "registerName",
        r.code AS "registerCode",
        s.cash_session_id AS "cashSessionId",
        s.customer_id AS "customerId",
        c.full_name AS "customerName",
        c.email AS "customerEmail",
        c.phone AS "customerPhone",
        s.sold_by AS "soldBy",
        p.full_name AS "soldByName",
        s.status,
        s.payment_status AS "paymentStatus",
        s.subtotal::double precision AS subtotal,
        s.discount_total::double precision AS "discountTotal",
        s.tax_total::double precision AS "taxTotal",
        s.total::double precision AS total,
        COALESCE(rt.refunded_total, 0)::double precision AS "refundedTotal",
        s.notes,
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt"
      FROM sales s
      INNER JOIN businesses b ON b.id = s.business_id
      INNER JOIN branches br ON br.id = s.branch_id
      INNER JOIN registers r ON r.id = s.register_id
      LEFT JOIN customers c ON c.id = s.customer_id
      LEFT JOIN profiles p ON p.id = s.sold_by
      LEFT JOIN (
        SELECT sale_id, SUM(total) AS refunded_total
        FROM refunds
        GROUP BY sale_id
      ) rt ON rt.sale_id = s.id
      WHERE s.id = CAST(${saleId} AS uuid)
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async listSales(
    businessId: string,
    branchId: string,
    query?: string,
    limit = 20,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const normalizedLimit = Math.min(Math.max(limit, 5), 50);
    const normalizedQuery = query?.trim();

    return executor.$queryRaw<SaleListRecord[]>(
      Prisma.sql`
        SELECT
          s.id,
          s.business_id AS "businessId",
          s.branch_id AS "branchId",
          s.register_id AS "registerId",
          s.cash_session_id AS "cashSessionId",
          s.customer_id AS "customerId",
          s.sold_by AS "soldBy",
          s.status,
          s.payment_status AS "paymentStatus",
          s.subtotal::double precision AS subtotal,
          s.discount_total::double precision AS "discountTotal",
          s.tax_total::double precision AS "taxTotal",
          s.total::double precision AS total,
          COALESCE(rt.refunded_total, 0)::double precision AS "refundedTotal",
          c.full_name AS "customerName",
          p.full_name AS "soldByName",
          s.notes,
          s.created_at AS "createdAt",
          s.updated_at AS "updatedAt"
        FROM sales s
        LEFT JOIN customers c ON c.id = s.customer_id
        LEFT JOIN profiles p ON p.id = s.sold_by
        LEFT JOIN (
          SELECT sale_id, SUM(total) AS refunded_total
          FROM refunds
          GROUP BY sale_id
        ) rt ON rt.sale_id = s.id
        WHERE s.business_id = CAST(${businessId} AS uuid)
          AND s.branch_id = CAST(${branchId} AS uuid)
          ${
            normalizedQuery
              ? Prisma.sql`
                  AND (
                    s.id::text ILIKE ${`%${normalizedQuery}%`}
                    OR CONCAT(
                      'VTA-',
                      TO_CHAR(s.created_at AT TIME ZONE 'UTC', 'YYYYMMDD'),
                      '-',
                      RIGHT(REPLACE(s.id::text, '-', ''), 6)
                    ) ILIKE ${`%${normalizedQuery.toUpperCase()}%`}
                    OR COALESCE(c.full_name, '') ILIKE ${`%${normalizedQuery}%`}
                    OR COALESCE(p.full_name, '') ILIKE ${`%${normalizedQuery}%`}
                  )
                `
              : Prisma.empty
          }
        ORDER BY s.created_at DESC
        LIMIT ${normalizedLimit}
      `,
    );
  }

  async getSaleItems(saleId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    return executor.$queryRaw<SaleItemRecord[]>(Prisma.sql`
      SELECT
        si.id,
        si.sale_id AS "saleId",
        si.product_id AS "productId",
        si.quantity::double precision AS quantity,
        si.unit_price::double precision AS "unitPrice",
        si.line_total::double precision AS "lineTotal",
        si.tax_total::double precision AS "taxTotal",
        si.discount_total::double precision AS "discountTotal",
        si.product_name_snapshot AS "productNameSnapshot",
        si.sku_snapshot AS "skuSnapshot",
        si.unit_cost_snapshot::double precision AS "unitCostSnapshot",
        COALESCE(ri.refunded_quantity, 0)::double precision AS "refundedQuantity",
        GREATEST(
          si.quantity - COALESCE(ri.refunded_quantity, 0),
          0
        )::double precision AS "remainingQuantity",
        COALESCE(p.track_inventory, false) AS "trackInventory"
      FROM sale_items si
      LEFT JOIN products p ON p.id = si.product_id
      LEFT JOIN (
        SELECT
          ri.sale_item_id,
          SUM(ri.quantity) AS refunded_quantity
        FROM refund_items ri
        GROUP BY ri.sale_item_id
      ) ri ON ri.sale_item_id = si.id
      WHERE si.sale_id = CAST(${saleId} AS uuid)
      ORDER BY si.id ASC
    `);
  }

  async getPayments(saleId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    return executor.$queryRaw<PaymentRecord[]>(Prisma.sql`
      SELECT
        id,
        sale_id AS "saleId",
        payment_method AS "paymentMethod",
        amount::double precision AS amount,
        reference,
        paid_at AS "paidAt"
      FROM payments
      WHERE sale_id = CAST(${saleId} AS uuid)
      ORDER BY paid_at ASC, id ASC
    `);
  }

  async getPaymentsBySaleIds(saleIds: string[], tx?: PrismaExecutor) {
    if (saleIds.length === 0) {
      return [];
    }

    const executor = tx ?? this.prisma;
    const saleIdList = saleIds.map(
      (saleId) => Prisma.sql`CAST(${saleId} AS uuid)`,
    );

    return executor.$queryRaw<PaymentRecord[]>(Prisma.sql`
      SELECT
        id,
        sale_id AS "saleId",
        payment_method AS "paymentMethod",
        amount::double precision AS amount,
        reference,
        paid_at AS "paidAt"
      FROM payments
      WHERE sale_id IN (${Prisma.join(saleIdList)})
      ORDER BY paid_at ASC, id ASC
    `);
  }

  async updateStockBalance(
    input: {
      businessId: string;
      branchId: string;
      locationId: string;
      productId: string;
      quantityDelta: number;
    },
    tx: PrismaExecutor,
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE stock_balances
        SET
          quantity = quantity + ${input.quantityDelta},
          updated_at = NOW()
        WHERE business_id = CAST(${input.businessId} AS uuid)
          AND branch_id = CAST(${input.branchId} AS uuid)
          AND location_id = CAST(${input.locationId} AS uuid)
          AND product_id = CAST(${input.productId} AS uuid)
      `,
    );
  }

  async createInventoryMovement(
    input: {
      businessId: string;
      branchId: string;
      locationId: string;
      productId: string;
      movementType: InventoryMovementType;
      quantity: number;
      referenceType?: string | null;
      referenceId?: string | null;
      unitCost: number;
      notes?: string | null;
      actorUserId: string;
    },
    tx: PrismaExecutor,
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO inventory_movements (
          business_id,
          branch_id,
          location_id,
          product_id,
          movement_type,
          quantity,
          reference_type,
          reference_id,
          unit_cost,
          notes,
          created_by,
          created_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          CAST(${input.branchId} AS uuid),
          CAST(${input.locationId} AS uuid),
          CAST(${input.productId} AS uuid),
          CAST(${input.movementType} AS inventory_movement_type),
          ${input.quantity},
          ${input.referenceType ?? null},
          CAST(${input.referenceId ?? null} AS uuid),
          ${input.unitCost},
          ${input.notes ?? null},
          CAST(${input.actorUserId} AS uuid),
          NOW()
        )
      `,
    );
  }

  async updateSaleStatus(
    input: {
      saleId: string;
      status: string;
      paymentStatus: string;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<SaleRecord[]>(Prisma.sql`
      UPDATE sales
      SET
        status = CAST(${input.status} AS sale_status),
        payment_status = CAST(${input.paymentStatus} AS payment_status),
        updated_at = NOW()
      WHERE id = CAST(${input.saleId} AS uuid)
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        register_id AS "registerId",
        cash_session_id AS "cashSessionId",
        customer_id AS "customerId",
        sold_by AS "soldBy",
        status,
        payment_status AS "paymentStatus",
        subtotal::double precision AS subtotal,
        discount_total::double precision AS "discountTotal",
        tax_total::double precision AS "taxTotal",
        total::double precision AS total,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0]!;
  }

  async createRefund(
    input: {
      businessId: string;
      branchId: string;
      saleId: string;
      refundedBy: string;
      subtotal: number;
      taxTotal: number;
      total: number;
      reason?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<RefundRecord[]>(Prisma.sql`
      INSERT INTO refunds (
        business_id,
        branch_id,
        sale_id,
        refunded_by,
        subtotal,
        tax_total,
        total,
        reason,
        created_at
      )
      VALUES (
        CAST(${input.businessId} AS uuid),
        CAST(${input.branchId} AS uuid),
        CAST(${input.saleId} AS uuid),
        CAST(${input.refundedBy} AS uuid),
        ${input.subtotal},
        ${input.taxTotal},
        ${input.total},
        ${input.reason ?? null},
        NOW()
      )
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        sale_id AS "saleId",
        refunded_by AS "refundedBy",
        NULL::text AS "refundedByName",
        subtotal::double precision AS subtotal,
        tax_total::double precision AS "taxTotal",
        total::double precision AS total,
        reason,
        created_at AS "createdAt"
    `);

    return rows[0]!;
  }

  async createRefundItem(
    input: {
      refundId: string;
      saleItemId: string;
      quantity: number;
      amount: number;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<RefundItemRecord[]>(Prisma.sql`
      INSERT INTO refund_items (
        refund_id,
        sale_item_id,
        quantity,
        amount
      )
      SELECT
        CAST(${input.refundId} AS uuid),
        CAST(${input.saleItemId} AS uuid),
        ${input.quantity},
        ${input.amount}
      RETURNING
        id,
        refund_id AS "refundId",
        sale_item_id AS "saleItemId",
        quantity::double precision AS quantity,
        amount::double precision AS amount,
        NULL::uuid AS "productId",
        NULL::text AS "productNameSnapshot",
        NULL::text AS "skuSnapshot"
    `);

    return rows[0]!;
  }

  async getRefundsBySaleId(saleId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    return executor.$queryRaw<RefundRecord[]>(Prisma.sql`
      SELECT
        r.id,
        r.business_id AS "businessId",
        r.branch_id AS "branchId",
        r.sale_id AS "saleId",
        r.refunded_by AS "refundedBy",
        p.full_name AS "refundedByName",
        r.subtotal::double precision AS subtotal,
        r.tax_total::double precision AS "taxTotal",
        r.total::double precision AS total,
        r.reason,
        r.created_at AS "createdAt"
      FROM refunds r
      LEFT JOIN profiles p ON p.id = r.refunded_by
      WHERE r.sale_id = CAST(${saleId} AS uuid)
      ORDER BY r.created_at DESC, r.id DESC
    `);
  }

  async getRefundItemsByRefundIds(refundIds: string[], tx?: PrismaExecutor) {
    if (refundIds.length === 0) {
      return [];
    }

    const executor = tx ?? this.prisma;
    const refundIdList = refundIds.map(
      (refundId) => Prisma.sql`CAST(${refundId} AS uuid)`,
    );

    return executor.$queryRaw<RefundItemRecord[]>(Prisma.sql`
      SELECT
        ri.id,
        ri.refund_id AS "refundId",
        ri.sale_item_id AS "saleItemId",
        ri.quantity::double precision AS quantity,
        ri.amount::double precision AS amount,
        si.product_id AS "productId",
        si.product_name_snapshot AS "productNameSnapshot",
        si.sku_snapshot AS "skuSnapshot"
      FROM refund_items ri
      INNER JOIN sale_items si ON si.id = ri.sale_item_id
      WHERE ri.refund_id IN (${Prisma.join(refundIdList)})
      ORDER BY ri.id ASC
    `);
  }

  async getSaleInventoryReturnTargets(saleId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<SaleInventoryReturnTargetRecord[]>(Prisma.sql`
      SELECT
        product_id AS "productId",
        location_id AS "locationId",
        SUM(quantity)::double precision AS quantity,
        MAX(unit_cost)::double precision AS "unitCost"
      FROM inventory_movements
      WHERE movement_type = CAST(${InventoryMovementType.SALE_OUT} AS inventory_movement_type)
        AND reference_type = 'sale'
        AND reference_id = CAST(${saleId} AS uuid)
      GROUP BY product_id, location_id
    `);
  }

  async createCashMovementExpense(
    input: {
      businessId: string;
      branchId: string;
      cashSessionId: string;
      amount: number;
      notes: string;
      createdBy: string;
    },
    tx: PrismaExecutor,
  ) {
    await tx.$executeRaw(
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
          'expense',
          ${input.amount},
          ${input.notes},
          CAST(${input.createdBy} AS uuid),
          NOW()
        )
      `,
    );
  }
}
