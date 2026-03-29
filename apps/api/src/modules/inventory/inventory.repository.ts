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

export interface InventoryProductListRecord extends InventoryProductRecord {
  taxRateName: string | null;
  costPrice: number;
  minStock: number;
  description: string | null;
  primaryImageUrl: string | null;
}

export interface InventoryProductDetailRecord {
  id: string;
  businessId: string;
  categoryId: string | null;
  brandId: string | null;
  taxRateId: string | null;
  name: string;
  sku: string;
  description: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  trackInventory: boolean;
  isActive: boolean;
  categoryName: string | null;
  brandName: string | null;
  taxRateName: string | null;
  taxRate: number;
  primaryImageUrl: string | null;
  availableStock?: number;
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

export interface ProductBarcodeRecord {
  barcode: string;
  isPrimary: boolean;
}

export interface CatalogItemRecord {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface TaxRateCatalogRecord {
  id: string;
  name: string;
  rate: number;
  isActive: boolean;
}

export interface SupplierCatalogRecord {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface InventoryLocationOptionRecord {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  totalQuantity?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  productsCount?: number;
}

export interface InventoryMovementRecord {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  movementType: string;
  quantity: number;
  unitCost: number;
  notes: string | null;
  referenceType: string | null;
  referenceId: string | null;
  locationId: string;
  locationName: string;
  locationCode?: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
}

export interface StockBalanceRecord {
  productId: string;
  locationId?: string;
  quantity: number;
  reservedQuantity?: number;
}

export interface ProductStockLocationRecord {
  locationId: string;
  locationName: string;
  locationCode: string;
  isDefault: boolean;
  isActive: boolean;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface InventoryAlertRecord {
  id: string;
  businessId: string;
  branchId: string | null;
  productId: string | null;
  alertType: string;
  title: string;
  message: string;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  productName?: string | null;
  productSku?: string | null;
  minStock?: number | null;
  availableStock?: number | null;
}

export interface GoodsReceiptRecord {
  id: string;
  businessId: string;
  branchId: string;
  locationId: string;
  supplierId: string | null;
  notes: string | null;
  createdAt: Date;
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

  async listProducts(
    businessId: string,
    branchId: string,
    options: {
      query?: string;
      includeInactive?: boolean;
      limit?: number;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const trimmedQuery = options.query?.trim() ?? '';
    const searchPattern = `%${trimmedQuery}%`;
    const limit = options.limit ?? 100;

    return executor.$queryRaw<InventoryProductListRecord[]>(
      Prisma.sql`
        SELECT
          p.id,
          p.business_id AS "businessId",
          p.name,
          p.sku,
          p.description,
          (
            SELECT pb.barcode
            FROM product_barcodes pb
            WHERE pb.product_id = p.id
            ORDER BY pb.is_primary DESC, pb.barcode
            LIMIT 1
          ) AS barcode,
          (
            SELECT pi.public_url
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at ASC
            LIMIT 1
          ) AS "primaryImageUrl",
          COALESCE(p.cost_price, 0)::double precision AS "costPrice",
          COALESCE(p.sale_price, 0)::double precision AS "unitPrice",
          COALESCE(p.min_stock, 0)::double precision AS "minStock",
          COALESCE(p.track_inventory, false) AS "trackInventory",
          COALESCE(tr.rate, 0)::double precision AS "taxRate",
          tr.name AS "taxRateName",
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
          ${
            options.includeInactive
              ? Prisma.empty
              : Prisma.sql`AND p.is_active = true`
          }
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
        ORDER BY p.is_active DESC, p.name
        LIMIT CAST(${limit} AS integer)
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
          p.id,
          p.business_id AS "businessId",
          p.category_id AS "categoryId",
          p.brand_id AS "brandId",
          p.tax_rate_id AS "taxRateId",
          p.name,
          p.sku,
          p.description,
          p.cost_price::double precision AS "costPrice",
          p.sale_price::double precision AS "salePrice",
          p.min_stock::double precision AS "minStock",
          COALESCE(p.track_inventory, false) AS "trackInventory",
          COALESCE(p.is_active, false) AS "isActive",
          c.name AS "categoryName",
          b.name AS "brandName",
          tr.name AS "taxRateName",
          COALESCE(tr.rate, 0)::double precision AS "taxRate",
          (
            SELECT pi.public_url
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at ASC
            LIMIT 1
          ) AS "primaryImageUrl"
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN tax_rates tr ON tr.id = p.tax_rate_id
        WHERE p.id = CAST(${productId} AS uuid)
          AND p.business_id = CAST(${businessId} AS uuid)
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async getProductDetail(
    businessId: string,
    branchId: string,
    productId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<InventoryProductDetailRecord[]>(
      Prisma.sql`
        SELECT
          p.id,
          p.business_id AS "businessId",
          p.category_id AS "categoryId",
          p.brand_id AS "brandId",
          p.tax_rate_id AS "taxRateId",
          p.name,
          p.sku,
          p.description,
          p.cost_price::double precision AS "costPrice",
          p.sale_price::double precision AS "salePrice",
          p.min_stock::double precision AS "minStock",
          COALESCE(p.track_inventory, false) AS "trackInventory",
          COALESCE(p.is_active, false) AS "isActive",
          c.name AS "categoryName",
          b.name AS "brandName",
          tr.name AS "taxRateName",
          COALESCE(tr.rate, 0)::double precision AS "taxRate",
          (
            SELECT pi.public_url
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at ASC
            LIMIT 1
          ) AS "primaryImageUrl",
          COALESCE((
            SELECT SUM(sb.quantity - sb.reserved_quantity)
            FROM stock_balances sb
            WHERE sb.business_id = CAST(${businessId} AS uuid)
              AND sb.branch_id = CAST(${branchId} AS uuid)
              AND sb.product_id = p.id
          ), 0)::double precision AS "availableStock"
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN tax_rates tr ON tr.id = p.tax_rate_id
        WHERE p.id = CAST(${productId} AS uuid)
          AND p.business_id = CAST(${businessId} AS uuid)
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async listProductBarcodes(productId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<ProductBarcodeRecord[]>(
      Prisma.sql`
        SELECT
          barcode,
          is_primary AS "isPrimary"
        FROM product_barcodes
        WHERE product_id = CAST(${productId} AS uuid)
        ORDER BY is_primary DESC, barcode ASC
      `,
    );
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

  async updateProduct(
    input: {
      productId: string;
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
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<Array<{ id: string; name: string }>>(
      Prisma.sql`
        UPDATE products
        SET
          category_id = CAST(${input.categoryId ?? null} AS uuid),
          brand_id = CAST(${input.brandId ?? null} AS uuid),
          tax_rate_id = CAST(${input.taxRateId ?? null} AS uuid),
          sku = ${input.sku},
          name = ${input.name},
          description = ${input.description ?? null},
          cost_price = ${input.costPrice},
          sale_price = ${input.salePrice},
          min_stock = ${input.minStock},
          track_inventory = ${input.trackInventory},
          updated_at = NOW()
        WHERE id = CAST(${input.productId} AS uuid)
          AND business_id = CAST(${input.businessId} AS uuid)
        RETURNING id, name
      `,
    );

    return rows[0] ?? null;
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

  async deleteProductBarcodes(productId: string, tx: PrismaExecutor) {
    await tx.$executeRaw(
      Prisma.sql`
        DELETE FROM product_barcodes
        WHERE product_id = CAST(${productId} AS uuid)
      `,
    );
  }

  async createProductImage(
    input: {
      productId: string;
      imageUrl: string;
      isPrimary?: boolean;
    },
    tx: PrismaExecutor,
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO product_images (
          product_id,
          storage_path,
          public_url,
          is_primary,
          sort_order,
          created_at,
          updated_at
        )
        VALUES (
          CAST(${input.productId} AS uuid),
          ${input.imageUrl},
          ${input.imageUrl},
          ${input.isPrimary ?? true},
          0,
          NOW(),
          NOW()
        )
      `,
    );
  }

  async deleteProductImages(productId: string, tx: PrismaExecutor) {
    await tx.$executeRaw(
      Prisma.sql`
        DELETE FROM product_images
        WHERE product_id = CAST(${productId} AS uuid)
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

  async reactivateProduct(
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
          is_active = true,
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

  async getCategoryById(
    businessId: string,
    categoryId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<Array<{ id: string; name: string }>>(
      Prisma.sql`
        SELECT id, name
        FROM categories
        WHERE id = CAST(${categoryId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
          AND is_active = true
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async getBrandById(businessId: string, brandId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<Array<{ id: string; name: string }>>(
      Prisma.sql`
        SELECT id, name
        FROM brands
        WHERE id = CAST(${brandId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
          AND is_active = true
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async getTaxRateById(
    businessId: string,
    taxRateId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<
      Array<{ id: string; name: string; rate: number }>
    >(
      Prisma.sql`
        SELECT
          id,
          name,
          rate::double precision AS rate
        FROM tax_rates
        WHERE id = CAST(${taxRateId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
          AND is_active = true
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async getSupplierById(
    businessId: string,
    supplierId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<Array<{ id: string; name: string }>>(
      Prisma.sql`
        SELECT id, name
        FROM suppliers
        WHERE id = CAST(${supplierId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
          AND is_active = true
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async listCategories(businessId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<CatalogItemRecord[]>(
      Prisma.sql`
        SELECT
          id,
          name,
          description,
          is_active AS "isActive"
        FROM categories
        WHERE business_id = CAST(${businessId} AS uuid)
          AND is_active = true
        ORDER BY name
      `,
    );
  }

  async listBrands(businessId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<CatalogItemRecord[]>(
      Prisma.sql`
        SELECT
          id,
          name,
          description,
          is_active AS "isActive"
        FROM brands
        WHERE business_id = CAST(${businessId} AS uuid)
          AND is_active = true
        ORDER BY name
      `,
    );
  }

  async listTaxRates(businessId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<TaxRateCatalogRecord[]>(
      Prisma.sql`
        SELECT
          id,
          name,
          rate::double precision AS rate,
          is_active AS "isActive"
        FROM tax_rates
        WHERE business_id = CAST(${businessId} AS uuid)
          AND is_active = true
        ORDER BY name
      `,
    );
  }

  async listSuppliers(businessId: string, tx?: PrismaExecutor) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<SupplierCatalogRecord[]>(
      Prisma.sql`
        SELECT
          id,
          name,
          contact_name AS "contactName",
          email,
          phone,
          notes,
          is_active AS "isActive"
        FROM suppliers
        WHERE business_id = CAST(${businessId} AS uuid)
          AND is_active = true
        ORDER BY name
      `,
    );
  }

  async listLocations(
    businessId: string,
    branchId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<InventoryLocationOptionRecord[]>(
      Prisma.sql`
        SELECT
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          name,
          code,
          is_default AS "isDefault",
          is_active AS "isActive"
        FROM inventory_locations
        WHERE business_id = CAST(${businessId} AS uuid)
          AND branch_id = CAST(${branchId} AS uuid)
          AND is_active = true
        ORDER BY is_default DESC, name ASC
      `,
    );
  }

  async listLocationsForManagement(
    businessId: string,
    branchId: string,
    options?: { includeInactive?: boolean },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<InventoryLocationOptionRecord[]>(
      Prisma.sql`
        SELECT
          il.id,
          il.business_id AS "businessId",
          il.branch_id AS "branchId",
          il.name,
          il.code,
          il.is_default AS "isDefault",
          il.is_active AS "isActive",
          il.created_at AS "createdAt",
          il.updated_at AS "updatedAt",
          COALESCE(stock.total_quantity, 0)::double precision AS "totalQuantity",
          COALESCE(stock.reserved_quantity, 0)::double precision AS "reservedQuantity",
          COALESCE(stock.available_quantity, 0)::double precision AS "availableQuantity",
          COALESCE(stock.products_count, 0)::double precision AS "productsCount"
        FROM inventory_locations il
        LEFT JOIN (
          SELECT
            location_id,
            SUM(quantity)::double precision AS total_quantity,
            SUM(reserved_quantity)::double precision AS reserved_quantity,
            SUM(quantity - reserved_quantity)::double precision AS available_quantity,
            COUNT(*)::double precision AS products_count
          FROM stock_balances
          WHERE business_id = CAST(${businessId} AS uuid)
            AND branch_id = CAST(${branchId} AS uuid)
          GROUP BY location_id
        ) stock ON stock.location_id = il.id
        WHERE il.business_id = CAST(${businessId} AS uuid)
          AND il.branch_id = CAST(${branchId} AS uuid)
          ${
            options?.includeInactive
              ? Prisma.empty
              : Prisma.sql`AND il.is_active = true`
          }
        ORDER BY il.is_default DESC, il.is_active DESC, il.name ASC
      `,
    );
  }

  async getLocationById(
    businessId: string,
    branchId: string,
    locationId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<InventoryLocationOptionRecord[]>(
      Prisma.sql`
        SELECT
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          name,
          code,
          is_default AS "isDefault",
          is_active AS "isActive",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM inventory_locations
        WHERE business_id = CAST(${businessId} AS uuid)
          AND branch_id = CAST(${branchId} AS uuid)
          AND id = CAST(${locationId} AS uuid)
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async createLocation(
    input: {
      businessId: string;
      branchId: string;
      name: string;
      code: string;
      isDefault: boolean;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<InventoryLocationOptionRecord[]>(Prisma.sql`
      INSERT INTO inventory_locations (
        business_id,
        branch_id,
        name,
        code,
        is_default,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        CAST(${input.businessId} AS uuid),
        CAST(${input.branchId} AS uuid),
        ${input.name},
        ${input.code},
        ${input.isDefault},
        true,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        name,
        code,
        is_default AS "isDefault",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0]!;
  }

  async updateLocation(
    input: {
      businessId: string;
      branchId: string;
      locationId: string;
      name?: string;
      code?: string;
      isDefault?: boolean;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<InventoryLocationOptionRecord[]>(Prisma.sql`
      UPDATE inventory_locations
      SET
        name = COALESCE(${input.name ?? null}, name),
        code = COALESCE(${input.code ?? null}, code),
        is_default = COALESCE(${input.isDefault ?? null}, is_default),
        updated_at = NOW()
      WHERE business_id = CAST(${input.businessId} AS uuid)
        AND branch_id = CAST(${input.branchId} AS uuid)
        AND id = CAST(${input.locationId} AS uuid)
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        name,
        code,
        is_default AS "isDefault",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0] ?? null;
  }

  async clearDefaultLocation(
    businessId: string,
    branchId: string,
    tx: PrismaExecutor,
    exceptLocationId?: string,
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE inventory_locations
        SET
          is_default = false,
          updated_at = NOW()
        WHERE business_id = CAST(${businessId} AS uuid)
          AND branch_id = CAST(${branchId} AS uuid)
          ${
            exceptLocationId
              ? Prisma.sql`AND id <> CAST(${exceptLocationId} AS uuid)`
              : Prisma.empty
          }
      `,
    );
  }

  async setLocationActive(
    businessId: string,
    branchId: string,
    locationId: string,
    isActive: boolean,
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<InventoryLocationOptionRecord[]>(Prisma.sql`
      UPDATE inventory_locations
      SET
        is_active = ${isActive},
        updated_at = NOW()
      WHERE business_id = CAST(${businessId} AS uuid)
        AND branch_id = CAST(${branchId} AS uuid)
        AND id = CAST(${locationId} AS uuid)
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        name,
        code,
        is_default AS "isDefault",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0] ?? null;
  }

  async countActiveLocations(
    businessId: string,
    branchId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<Array<{ total: number }>>(Prisma.sql`
      SELECT COUNT(*)::double precision AS total
      FROM inventory_locations
      WHERE business_id = CAST(${businessId} AS uuid)
        AND branch_id = CAST(${branchId} AS uuid)
        AND is_active = true
    `);

    return rows[0]?.total ?? 0;
  }

  async getNextActiveLocation(
    businessId: string,
    branchId: string,
    excludedLocationId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<InventoryLocationOptionRecord[]>(
      Prisma.sql`
        SELECT
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          name,
          code,
          is_default AS "isDefault",
          is_active AS "isActive",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM inventory_locations
        WHERE business_id = CAST(${businessId} AS uuid)
          AND branch_id = CAST(${branchId} AS uuid)
          AND is_active = true
          AND id <> CAST(${excludedLocationId} AS uuid)
        ORDER BY name ASC, id ASC
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async getLocationBalanceSummary(
    businessId: string,
    branchId: string,
    locationId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<
      Array<{
        totalQuantity: number;
        reservedQuantity: number;
        availableQuantity: number;
      }>
    >(Prisma.sql`
      SELECT
        COALESCE(SUM(quantity), 0)::double precision AS "totalQuantity",
        COALESCE(SUM(reserved_quantity), 0)::double precision AS "reservedQuantity",
        COALESCE(SUM(quantity - reserved_quantity), 0)::double precision AS "availableQuantity"
      FROM stock_balances
      WHERE business_id = CAST(${businessId} AS uuid)
        AND branch_id = CAST(${branchId} AS uuid)
        AND location_id = CAST(${locationId} AS uuid)
    `);

    return (
      rows[0] ?? {
        totalQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
      }
    );
  }

  async listProductStockByLocation(
    businessId: string,
    branchId: string,
    productId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<ProductStockLocationRecord[]>(Prisma.sql`
      SELECT
        il.id AS "locationId",
        il.name AS "locationName",
        il.code AS "locationCode",
        il.is_default AS "isDefault",
        il.is_active AS "isActive",
        COALESCE(sb.quantity, 0)::double precision AS quantity,
        COALESCE(sb.reserved_quantity, 0)::double precision AS "reservedQuantity",
        COALESCE(sb.quantity - sb.reserved_quantity, 0)::double precision AS "availableQuantity"
      FROM inventory_locations il
      LEFT JOIN stock_balances sb
        ON sb.location_id = il.id
        AND sb.business_id = CAST(${businessId} AS uuid)
        AND sb.branch_id = CAST(${branchId} AS uuid)
        AND sb.product_id = CAST(${productId} AS uuid)
      WHERE il.business_id = CAST(${businessId} AS uuid)
        AND il.branch_id = CAST(${branchId} AS uuid)
      ORDER BY il.is_default DESC, il.is_active DESC, il.name ASC
    `);
  }

  async createCategory(
    input: {
      businessId: string;
      name: string;
      description?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<CatalogItemRecord[]>(
      Prisma.sql`
        INSERT INTO categories (
          business_id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          ${input.name},
          ${input.description ?? null},
          true,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          name,
          description,
          is_active AS "isActive"
      `,
    );

    return rows[0]!;
  }

  async createBrand(
    input: {
      businessId: string;
      name: string;
      description?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<CatalogItemRecord[]>(
      Prisma.sql`
        INSERT INTO brands (
          business_id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          ${input.name},
          ${input.description ?? null},
          true,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          name,
          description,
          is_active AS "isActive"
      `,
    );

    return rows[0]!;
  }

  async createTaxRate(
    input: {
      businessId: string;
      name: string;
      rate: number;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<TaxRateCatalogRecord[]>(
      Prisma.sql`
        INSERT INTO tax_rates (
          business_id,
          name,
          rate,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          ${input.name},
          ${input.rate},
          true,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          name,
          rate::double precision AS rate,
          is_active AS "isActive"
      `,
    );

    return rows[0]!;
  }

  async createSupplier(
    input: {
      businessId: string;
      name: string;
      contactName?: string | null;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<SupplierCatalogRecord[]>(
      Prisma.sql`
        INSERT INTO suppliers (
          business_id,
          name,
          contact_name,
          email,
          phone,
          address,
          notes,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          ${input.name},
          ${input.contactName ?? null},
          ${input.email ?? null},
          ${input.phone ?? null},
          NULL,
          ${input.notes ?? null},
          true,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          name,
          contact_name AS "contactName",
          email,
          phone,
          notes,
          is_active AS "isActive"
      `,
    );

    return rows[0]!;
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
          location_id AS "locationId",
          quantity::double precision AS quantity,
          reserved_quantity::double precision AS "reservedQuantity"
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
      referenceType?: string | null;
      referenceId?: string | null;
      unitCost?: number | null;
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
          ${input.unitCost ?? 0},
          ${input.notes ?? null},
          CAST(${input.actorUserId} AS uuid),
          NOW()
        )
      `,
    );
  }

  async listProductMovements(
    businessId: string,
    branchId: string,
    productId: string,
    limit = 20,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<InventoryMovementRecord[]>(
      Prisma.sql`
        SELECT
          im.id,
          im.product_id AS "productId",
          pr.name AS "productName",
          pr.sku,
          im.movement_type AS "movementType",
          im.quantity::double precision AS quantity,
          COALESCE(im.unit_cost, 0)::double precision AS "unitCost",
          im.notes,
          im.reference_type AS "referenceType",
          im.reference_id::text AS "referenceId",
          im.location_id AS "locationId",
          il.name AS "locationName",
          il.code AS "locationCode",
          im.created_by AS "createdBy",
          p.full_name AS "createdByName",
          im.created_at AS "createdAt"
        FROM inventory_movements im
        INNER JOIN inventory_locations il ON il.id = im.location_id
        INNER JOIN products pr ON pr.id = im.product_id
        LEFT JOIN profiles p ON p.id = im.created_by
        WHERE im.business_id = CAST(${businessId} AS uuid)
          AND im.branch_id = CAST(${branchId} AS uuid)
          AND im.product_id = CAST(${productId} AS uuid)
        ORDER BY im.created_at DESC
        LIMIT CAST(${limit} AS integer)
      `,
    );
  }

  async listInventoryMovements(
    businessId: string,
    branchId: string,
    options: {
      productId?: string;
      locationId?: string;
      movementType?: string;
      limit?: number;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const limit = Math.min(Math.max(options.limit ?? 40, 1), 100);

    return executor.$queryRaw<InventoryMovementRecord[]>(Prisma.sql`
      SELECT
        im.id,
        im.product_id AS "productId",
        pr.name AS "productName",
        pr.sku,
        im.movement_type AS "movementType",
        im.quantity::double precision AS quantity,
        COALESCE(im.unit_cost, 0)::double precision AS "unitCost",
        im.notes,
        im.reference_type AS "referenceType",
        im.reference_id::text AS "referenceId",
        im.location_id AS "locationId",
        il.name AS "locationName",
        il.code AS "locationCode",
        im.created_by AS "createdBy",
        p.full_name AS "createdByName",
        im.created_at AS "createdAt"
      FROM inventory_movements im
      INNER JOIN inventory_locations il ON il.id = im.location_id
      INNER JOIN products pr ON pr.id = im.product_id
      LEFT JOIN profiles p ON p.id = im.created_by
      WHERE im.business_id = CAST(${businessId} AS uuid)
        AND im.branch_id = CAST(${branchId} AS uuid)
        ${
          options.productId
            ? Prisma.sql`AND im.product_id = CAST(${options.productId} AS uuid)`
            : Prisma.empty
        }
        ${
          options.locationId
            ? Prisma.sql`AND im.location_id = CAST(${options.locationId} AS uuid)`
            : Prisma.empty
        }
        ${
          options.movementType
            ? Prisma.sql`AND im.movement_type = CAST(${options.movementType} AS inventory_movement_type)`
            : Prisma.empty
        }
      ORDER BY im.created_at DESC
      LIMIT CAST(${limit} AS integer)
    `);
  }

  async listLowStockCandidates(
    businessId: string,
    branchId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<
      Array<{
        productId: string;
        productName: string;
        sku: string | null;
        minStock: number;
        availableStock: number;
      }>
    >(Prisma.sql`
      SELECT
        p.id AS "productId",
        p.name AS "productName",
        p.sku,
        p.min_stock::double precision AS "minStock",
        COALESCE(stock.available_stock, 0)::double precision AS "availableStock"
      FROM products p
      LEFT JOIN (
        SELECT
          product_id,
          SUM(quantity - reserved_quantity)::double precision AS available_stock
        FROM stock_balances
        WHERE business_id = CAST(${businessId} AS uuid)
          AND branch_id = CAST(${branchId} AS uuid)
        GROUP BY product_id
      ) stock ON stock.product_id = p.id
      WHERE p.business_id = CAST(${businessId} AS uuid)
        AND p.is_active = true
        AND COALESCE(p.track_inventory, false) = true
        AND COALESCE(p.min_stock, 0) > 0
      ORDER BY p.name ASC
    `);
  }

  async listLatestLowStockAlertsByProductIds(
    businessId: string,
    branchId: string,
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

    return executor.$queryRaw<InventoryAlertRecord[]>(Prisma.sql`
      SELECT DISTINCT ON (a.product_id)
        a.id,
        a.business_id AS "businessId",
        a.branch_id AS "branchId",
        a.product_id AS "productId",
        a.alert_type AS "alertType",
        a.title,
        a.message,
        a.status,
        a.metadata,
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt"
      FROM alerts a
      WHERE a.business_id = CAST(${businessId} AS uuid)
        AND a.branch_id = CAST(${branchId} AS uuid)
        AND a.alert_type = 'low_stock'
        AND a.product_id IN (${Prisma.join(productIdList)})
      ORDER BY a.product_id, a.updated_at DESC, a.created_at DESC
    `);
  }

  async listLatestLowStockAlerts(
    businessId: string,
    branchId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    return executor.$queryRaw<InventoryAlertRecord[]>(Prisma.sql`
      SELECT DISTINCT ON (a.product_id)
        a.id,
        a.business_id AS "businessId",
        a.branch_id AS "branchId",
        a.product_id AS "productId",
        a.alert_type AS "alertType",
        a.title,
        a.message,
        a.status,
        a.metadata,
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt"
      FROM alerts a
      WHERE a.business_id = CAST(${businessId} AS uuid)
        AND a.branch_id = CAST(${branchId} AS uuid)
        AND a.alert_type = 'low_stock'
      ORDER BY a.product_id, a.updated_at DESC, a.created_at DESC
    `);
  }

  async createInventoryAlert(
    input: {
      businessId: string;
      branchId: string;
      productId?: string | null;
      alertType: string;
      title: string;
      message: string;
      status: string;
      metadata: unknown;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<InventoryAlertRecord[]>(Prisma.sql`
      INSERT INTO alerts (
        business_id,
        branch_id,
        product_id,
        alert_type,
        title,
        message,
        status,
        metadata,
        created_at,
        updated_at
      )
      VALUES (
        CAST(${input.businessId} AS uuid),
        CAST(${input.branchId} AS uuid),
        CAST(${input.productId ?? null} AS uuid),
        ${input.alertType},
        ${input.title},
        ${input.message},
        CAST(${input.status} AS stock_alert_status),
        CAST(${JSON.stringify(input.metadata)} AS jsonb),
        NOW(),
        NOW()
      )
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        product_id AS "productId",
        alert_type AS "alertType",
        title,
        message,
        status,
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0]!;
  }

  async updateInventoryAlert(
    input: {
      alertId: string;
      businessId: string;
      branchId: string;
      title?: string;
      message?: string;
      status?: string;
      metadata?: unknown;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<InventoryAlertRecord[]>(Prisma.sql`
      UPDATE alerts
      SET
        title = COALESCE(${input.title ?? null}, title),
        message = COALESCE(${input.message ?? null}, message),
        status = COALESCE(CAST(${input.status ?? null} AS stock_alert_status), status),
        metadata = COALESCE(CAST(${input.metadata ? JSON.stringify(input.metadata) : null} AS jsonb), metadata),
        updated_at = NOW()
      WHERE id = CAST(${input.alertId} AS uuid)
        AND business_id = CAST(${input.businessId} AS uuid)
        AND branch_id = CAST(${input.branchId} AS uuid)
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        product_id AS "productId",
        alert_type AS "alertType",
        title,
        message,
        status,
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0] ?? null;
  }

  async getInventoryAlertById(
    businessId: string,
    branchId: string,
    alertId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<InventoryAlertRecord[]>(Prisma.sql`
      SELECT
        a.id,
        a.business_id AS "businessId",
        a.branch_id AS "branchId",
        a.product_id AS "productId",
        a.alert_type AS "alertType",
        a.title,
        a.message,
        a.status,
        a.metadata,
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt"
      FROM alerts a
      WHERE a.business_id = CAST(${businessId} AS uuid)
        AND a.branch_id = CAST(${branchId} AS uuid)
        AND a.id = CAST(${alertId} AS uuid)
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async listInventoryAlerts(
    businessId: string,
    branchId: string,
    options?: { status?: string; limit?: number },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);

    return executor.$queryRaw<InventoryAlertRecord[]>(Prisma.sql`
      SELECT
        a.id,
        a.business_id AS "businessId",
        a.branch_id AS "branchId",
        a.product_id AS "productId",
        a.alert_type AS "alertType",
        a.title,
        a.message,
        a.status,
        a.metadata,
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt",
        p.name AS "productName",
        p.sku AS "productSku",
        p.min_stock::double precision AS "minStock"
      FROM alerts a
      LEFT JOIN products p ON p.id = a.product_id
      WHERE a.business_id = CAST(${businessId} AS uuid)
        AND a.branch_id = CAST(${branchId} AS uuid)
        ${
          options?.status
            ? Prisma.sql`AND a.status = CAST(${options.status} AS stock_alert_status)`
            : Prisma.empty
        }
      ORDER BY a.updated_at DESC, a.created_at DESC
      LIMIT CAST(${limit} AS integer)
    `);
  }

  async createGoodsReceipt(
    input: {
      businessId: string;
      branchId: string;
      locationId: string;
      supplierId?: string | null;
      notes?: string | null;
      receivedBy: string;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<GoodsReceiptRecord[]>(
      Prisma.sql`
        INSERT INTO goods_receipts (
          business_id,
          branch_id,
          location_id,
          purchase_order_id,
          received_by,
          supplier_id,
          notes,
          created_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          CAST(${input.branchId} AS uuid),
          CAST(${input.locationId} AS uuid),
          NULL,
          CAST(${input.receivedBy} AS uuid),
          CAST(${input.supplierId ?? null} AS uuid),
          ${input.notes ?? null},
          NOW()
        )
        RETURNING
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          location_id AS "locationId",
          supplier_id AS "supplierId",
          notes,
          created_at AS "createdAt"
      `,
    );

    return rows[0]!;
  }

  async createGoodsReceiptItem(
    input: {
      goodsReceiptId: string;
      productId: string;
      quantity: number;
      unitCost: number;
    },
    tx: PrismaExecutor,
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO goods_receipt_items (
          goods_receipt_id,
          product_id,
          quantity,
          unit_cost
        )
        VALUES (
          CAST(${input.goodsReceiptId} AS uuid),
          CAST(${input.productId} AS uuid),
          ${input.quantity},
          ${input.unitCost}
        )
      `,
    );
  }
}
