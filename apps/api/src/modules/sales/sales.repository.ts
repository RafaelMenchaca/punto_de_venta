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
  cashSessionId: string;
  customerId: string | null;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface SaleItemRecord {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxTotal: number;
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
  status: string | null;
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

    return executor.$queryRaw<SaleProductRecord[]>(
      Prisma.sql`
        SELECT
          p.id,
          p.business_id AS "businessId",
          p.name,
          p.sku,
          COALESCE(p.unit_price, 0)::double precision AS "unitPrice",
          COALESCE(p.unit_cost, 0)::double precision AS "unitCost",
          COALESCE(p.track_inventory, false) AS "trackInventory",
          COALESCE(tr.rate, 0)::double precision AS "taxRate"
        FROM products p
        LEFT JOIN tax_rates tr ON tr.id = p.tax_rate_id
        WHERE p.business_id = ${businessId}
          AND p.id IN (${Prisma.join(productIds)})
      `,
    );
  }

  async lockStockBalance(
    businessId: string,
    branchId: string,
    locationId: string,
    productId: string,
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<StockBalanceLockRecord[]>(
      Prisma.sql`
        SELECT
          product_id AS "productId",
          quantity::double precision AS quantity
        FROM stock_balances
        WHERE business_id = ${businessId}
          AND branch_id = ${branchId}
          AND location_id = ${locationId}
          AND product_id = ${productId}
        FOR UPDATE
      `,
    );

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
      subtotal: number;
      discountTotal: number;
      taxTotal: number;
      total: number;
      notes?: string | null;
      createdBy: string;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<SaleRecord[]>(
      Prisma.sql`
        INSERT INTO sales (
          business_id,
          branch_id,
          register_id,
          cash_session_id,
          customer_id,
          status,
          subtotal,
          discount_total,
          tax_total,
          total,
          notes,
          created_by,
          created_at
        )
        VALUES (
          ${input.businessId},
          ${input.branchId},
          ${input.registerId},
          ${input.cashSessionId},
          ${input.customerId ?? null},
          ${input.status},
          ${input.subtotal},
          ${input.discountTotal},
          ${input.taxTotal},
          ${input.total},
          ${input.notes ?? null},
          ${input.createdBy},
          NOW()
        )
        RETURNING
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          register_id AS "registerId",
          cash_session_id AS "cashSessionId",
          customer_id AS "customerId",
          status,
          subtotal::double precision AS subtotal,
          discount_total::double precision AS "discountTotal",
          tax_total::double precision AS "taxTotal",
          total::double precision AS total,
          notes,
          created_by AS "createdBy",
          created_at AS "createdAt"
      `,
    );

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
    const rows = await tx.$queryRaw<SaleItemRecord[]>(
      Prisma.sql`
        INSERT INTO sale_items (
          sale_id,
          product_id,
          quantity,
          unit_price,
          line_total,
          tax_total,
          product_name_snapshot,
          sku_snapshot,
          unit_cost_snapshot
        )
        VALUES (
          ${input.saleId},
          ${input.productId},
          ${input.quantity},
          ${input.unitPrice},
          ${input.lineTotal},
          ${input.taxTotal},
          ${input.productNameSnapshot},
          ${input.skuSnapshot},
          ${input.unitCostSnapshot}
        )
        RETURNING
          id,
          sale_id AS "saleId",
          product_id AS "productId",
          quantity::double precision AS quantity,
          unit_price::double precision AS "unitPrice",
          line_total::double precision AS "lineTotal",
          tax_total::double precision AS "taxTotal",
          product_name_snapshot AS "productNameSnapshot",
          sku_snapshot AS "skuSnapshot",
          unit_cost_snapshot::double precision AS "unitCostSnapshot"
      `,
    );

    return rows[0]!;
  }

  async createPayment(
    input: {
      saleId: string;
      businessId: string;
      branchId: string;
      cashSessionId: string;
      paymentMethod: string;
      amount: number;
      reference?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<PaymentRecord[]>(
      Prisma.sql`
        INSERT INTO payments (
          sale_id,
          business_id,
          branch_id,
          cash_session_id,
          payment_method,
          amount,
          reference,
          status,
          created_at
        )
        VALUES (
          ${input.saleId},
          ${input.businessId},
          ${input.branchId},
          ${input.cashSessionId},
          ${input.paymentMethod},
          ${input.amount},
          ${input.reference ?? null},
          'paid',
          NOW()
        )
        RETURNING
          id,
          sale_id AS "saleId",
          payment_method AS "paymentMethod",
          amount::double precision AS amount,
          reference,
          status
      `,
    );

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
        SET quantity = quantity + ${input.quantityDelta}
        WHERE business_id = ${input.businessId}
          AND branch_id = ${input.branchId}
          AND location_id = ${input.locationId}
          AND product_id = ${input.productId}
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
          created_by,
          created_at
        )
        VALUES (
          ${input.businessId},
          ${input.branchId},
          ${input.locationId},
          ${input.productId},
          ${InventoryMovementType.SALE_OUT},
          ${input.quantity},
          'sale',
          ${input.referenceId},
          ${input.actorUserId},
          NOW()
        )
      `,
    );
  }
}
