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
  isActive: boolean;
  categoryName: string | null;
  brandName: string | null;
}

export interface InventoryProductDetailRecord {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  description: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  trackInventory: boolean;
  isActive: boolean;
}

export interface CreatedProductRecord {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  description: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  trackInventory: boolean;
  isActive: boolean;
  createdAt: Date;
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
    query = '',
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const trimmedQuery = query.trim();
    const searchPattern = `%${trimmedQuery}%`;

    return executor.$queryRaw<InventoryProductRecord[]>(
      Prisma.sql`
        SELECT
          p.id,
          p.business_id AS "businessId",
          p.name,
          p.sku,
          (
            SELECT pb.barcode
            FROM product_barcodes pb
            WHERE pb.product_id = p.id
            ORDER BY pb.is_primary DESC, pb.barcode
            LIMIT 1
          ) AS barcode,
          COALESCE(p.sale_price, 0)::double precision AS "unitPrice",
          COALESCE(p.track_inventory, false) AS "trackInventory",
          COALESCE(tr.rate, 0)::double precision AS "taxRate",
          COALESCE(p.is_active, false) AS "isActive",
          c.name AS "categoryName",
          b.name AS "brandName",
          COALESCE((
            SELECT SUM(sb.quantity - sb.reserved_quantity)
            FROM stock_balances sb
            WHERE sb.business_id = CAST(${businessId} AS uuid)
              AND sb.branch_id = CAST(${branchId} AS uuid)
              AND sb.product_id = p.id
          ), 0)::double precision AS "availableStock"
        FROM products p
        LEFT JOIN tax_rates tr ON tr.id = p.tax_rate_id
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE p.business_id = CAST(${businessId} AS uuid)
          AND p.is_active = true
          ${
            trimmedQuery.length > 0
              ? Prisma.sql`
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
                `
              : Prisma.empty
          }
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
          sku,
          description,
          cost_price::double precision AS "costPrice",
          sale_price::double precision AS "salePrice",
          min_stock::double precision AS "minStock",
          COALESCE(track_inventory, false) AS "trackInventory",
          COALESCE(is_active, false) AS "isActive"
        FROM products
        WHERE id = CAST(${productId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async createProduct(
    input: {
      businessId: string;
      categoryId?: string | null;
      brandId?: string | null;
      taxRateId?: string | null;
      sku: string;
      name: string;
      description?: string | null;
      costPrice: number;
      salePrice: number;
      minStock: number;
      trackInventory: boolean;
      createdBy: string;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<CreatedProductRecord[]>(
      Prisma.sql`
        INSERT INTO products (
          business_id,
          category_id,
          brand_id,
          tax_rate_id,
          sku,
          name,
          description,
          cost_price,
          sale_price,
          min_stock,
          track_inventory,
          is_active,
          created_by,
          created_at,
          updated_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          CAST(${input.categoryId ?? null} AS uuid),
          CAST(${input.brandId ?? null} AS uuid),
          CAST(${input.taxRateId ?? null} AS uuid),
          ${input.sku},
          ${input.name},
          ${input.description ?? null},
          ${input.costPrice},
          ${input.salePrice},
          ${input.minStock},
          ${input.trackInventory},
          true,
          CAST(${input.createdBy} AS uuid),
          NOW(),
          NOW()
        )
        RETURNING
          id,
          business_id AS "businessId",
          name,
          sku,
          description,
          cost_price::double precision AS "costPrice",
          sale_price::double precision AS "salePrice",
          min_stock::double precision AS "minStock",
          track_inventory AS "trackInventory",
          is_active AS "isActive",
          created_at AS "createdAt"
      `,
    );

    return rows[0]!;
  }

  async createProductBarcode(
    input: {
      productId: string;
      barcode: string;
      isPrimary?: boolean;
    },
    tx: PrismaExecutor,
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO product_barcodes (
          product_id,
          barcode,
          is_primary,
          created_at,
          updated_at
        )
        VALUES (
          CAST(${input.productId} AS uuid),
          ${input.barcode},
          ${input.isPrimary ?? true},
          NOW(),
          NOW()
        )
      `,
    );
  }

  async deactivateProduct(
    businessId: string,
    productId: string,
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<
      Array<{ id: string; name: string; isActive: boolean }>
    >(
      Prisma.sql`
        UPDATE products
        SET
          is_active = false,
          updated_at = NOW()
        WHERE id = CAST(${productId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
        RETURNING
          id,
          name,
          is_active AS "isActive"
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
        WHERE id = CAST(${locationId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
          AND branch_id = CAST(${branchId} AS uuid)
          AND is_active = true
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
        WHERE business_id = CAST(${businessId} AS uuid)
          AND branch_id = CAST(${branchId} AS uuid)
          AND location_id = CAST(${locationId} AS uuid)
          AND product_id = CAST(${productId} AS uuid)
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
          quantity,
          reserved_quantity,
          updated_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          CAST(${input.branchId} AS uuid),
          CAST(${input.locationId} AS uuid),
          CAST(${input.productId} AS uuid),
          ${input.quantity},
          0,
          NOW()
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
        SET
          quantity = ${input.quantity},
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
          'stock_adjustment',
          CAST(${input.productId} AS uuid),
          ${input.reason},
          CAST(${input.actorUserId} AS uuid),
          NOW()
        )
      `,
    );
  }
}
