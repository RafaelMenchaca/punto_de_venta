import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';

export interface InventoryProductRecord {
  id: string;
  businessId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unitPrice: number;
  trackInventory: boolean;
  taxRate: number;
  availableStock: number;
}

export interface InventoryProductDetailRecord {
  id: string;
  businessId: string;
  name: string;
  trackInventory: boolean;
}

export interface StockBalanceRecord {
  productId: string;
  quantity: number;
}

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchProducts(
    businessId: string,
    branchId: string,
    query: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const searchPattern = `%${query}%`;

    return executor.$queryRaw<InventoryProductRecord[]>(
      Prisma.sql`
        SELECT
          p.id,
          p.business_id AS "businessId",
          p.name,
          p.sku,
          (
            SELECT barcode
            FROM product_barcodes pb
            WHERE pb.product_id = p.id
            ORDER BY barcode
            LIMIT 1
          ) AS barcode,
          COALESCE(p.unit_price, 0)::double precision AS "unitPrice",
          COALESCE(p.track_inventory, false) AS "trackInventory",
          COALESCE(tr.rate, 0)::double precision AS "taxRate",
          COALESCE((
            SELECT SUM(sb.quantity)
            FROM stock_balances sb
            WHERE sb.business_id = ${businessId}
              AND sb.branch_id = ${branchId}
              AND sb.product_id = p.id
          ), 0)::double precision AS "availableStock"
        FROM products p
        LEFT JOIN tax_rates tr ON tr.id = p.tax_rate_id
        WHERE p.business_id = ${businessId}
          AND (
            p.name ILIKE ${searchPattern}
            OR p.sku ILIKE ${searchPattern}
            OR EXISTS (
              SELECT 1
              FROM product_barcodes pb2
              WHERE pb2.product_id = p.id
                AND pb2.barcode ILIKE ${searchPattern}
            )
          )
        ORDER BY p.name
        LIMIT 20
      `,
    );
  }

  async getProductById(
    businessId: string,
    productId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<InventoryProductDetailRecord[]>(
      Prisma.sql`
        SELECT
          id,
          business_id AS "businessId",
          name,
          COALESCE(track_inventory, false) AS "trackInventory"
        FROM products
        WHERE id = ${productId}
          AND business_id = ${businessId}
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async assertLocationBelongsToBranch(
    businessId: string,
    branchId: string,
    locationId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM inventory_locations
        WHERE id = ${locationId}
          AND business_id = ${businessId}
          AND branch_id = ${branchId}
        LIMIT 1
      `,
    );

    return rows.length > 0;
  }

  async lockStockBalance(
    businessId: string,
    branchId: string,
    locationId: string,
    productId: string,
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<StockBalanceRecord[]>(
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

  async insertStockBalance(
    input: {
      businessId: string;
      branchId: string;
      locationId: string;
      productId: string;
      quantity: number;
    },
    tx: PrismaExecutor,
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO stock_balances (
          business_id,
          branch_id,
          location_id,
          product_id,
          quantity
        )
        VALUES (
          ${input.businessId},
          ${input.branchId},
          ${input.locationId},
          ${input.productId},
          ${input.quantity}
        )
      `,
    );
  }

  async updateStockBalance(
    input: {
      businessId: string;
      branchId: string;
      locationId: string;
      productId: string;
      quantity: number;
    },
    tx: PrismaExecutor,
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE stock_balances
        SET quantity = ${input.quantity}
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
      movementType: InventoryMovementType;
      quantity: number;
      reason: string;
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
          reason,
          created_by,
          created_at
        )
        VALUES (
          ${input.businessId},
          ${input.branchId},
          ${input.locationId},
          ${input.productId},
          ${input.movementType},
          ${input.quantity},
          'stock_adjustment',
          ${input.productId},
          ${input.reason},
          ${input.actorUserId},
          NOW()
        )
      `,
    );
  }
}
