import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
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
  status: string;
  paymentStatus: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
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
}

export interface PaymentRecord {
  id: string;
  saleId: string;
  paymentMethod: string;
  amount: number;
  reference: string | null;
  paidAt: Date;
}

@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProductsForSale(
    businessId: string,
    productIds: string[],
    tx?: PrismaExecutor,
  ) {
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
    `);
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
        0,
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
        unit_cost_snapshot::double precision AS "unitCostSnapshot"
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
      quantity: number;
      referenceId: string;
      unitCost: number;
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
          CAST(${InventoryMovementType.SALE_OUT} AS inventory_movement_type),
          ${input.quantity},
          'sale',
          CAST(${input.referenceId} AS uuid),
          ${input.unitCost},
          'Salida por venta',
          CAST(${input.actorUserId} AS uuid),
          NOW()
        )
      `,
    );
  }
}
