import { Injectable } from '@nestjs/common';
import { PurchaseOrderStatus } from '../../common/enums/purchase-order-status.enum';
import { Prisma } from '../../generated/prisma/client';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';

export interface SupplierRecord {
  id: string;
  businessId: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseProductRecord {
  id: string;
  name: string;
  sku: string | null;
  taxRate: number;
  isActive: boolean;
}

export interface PurchaseOrderRecord {
  id: string;
  businessId: string;
  branchId: string;
  supplierId: string;
  supplierName: string;
  supplierContactName: string | null;
  supplierEmail: string | null;
  supplierPhone: string | null;
  supplierAddress: string | null;
  status: PurchaseOrderStatus;
  orderedBy: string | null;
  orderedByName: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderListRecord extends PurchaseOrderRecord {
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  itemsCount: number;
  receiptCount: number;
}

export interface PurchaseOrderItemRecord {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitCost: number;
  taxRate: number;
  lineTotal: number;
}

export interface PurchaseOrderItemSummaryRecord extends PurchaseOrderItemRecord {
  receivedQuantity: number;
  pendingQuantity: number;
}

export interface PurchaseOrderSummaryRecord {
  purchaseOrderId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  receiptCount: number;
}

export interface PurchaseOrderReceivedProductRecord {
  productId: string;
  receivedQuantity: number;
}

export interface PurchaseOrderReceiptRecord {
  id: string;
  businessId: string;
  branchId: string;
  purchaseOrderId: string | null;
  purchaseOrderCreatedAt: Date | null;
  locationId: string;
  locationName: string;
  supplierId: string | null;
  supplierName: string | null;
  receivedBy: string | null;
  receivedByName: string | null;
  notes: string | null;
  createdAt: Date;
  itemsCount: number;
  totalQuantity: number;
  totalCost: number;
  purchaseOrderStatus: PurchaseOrderStatus | null;
}

export type PurchaseOrderReceiptListRecord = PurchaseOrderReceiptRecord;

export interface PurchaseOrderReceiptItemRecord {
  id: string;
  goodsReceiptId: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitCost: number;
}

@Injectable()
export class PurchasingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getExecutor(tx?: PrismaExecutor) {
    return tx ?? this.prisma;
  }

  async listSuppliers(
    businessId: string,
    options: { query?: string; includeInactive?: boolean },
    tx?: PrismaExecutor,
  ) {
    const executor = this.getExecutor(tx);
    const trimmedQuery = options.query?.trim() ?? '';
    const searchPattern = `%${trimmedQuery}%`;

    return executor.$queryRaw<SupplierRecord[]>(Prisma.sql`
      SELECT
        id,
        business_id AS "businessId",
        name,
        contact_name AS "contactName",
        email,
        phone,
        address,
        notes,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM suppliers
      WHERE business_id = CAST(${businessId} AS uuid)
        ${
          options.includeInactive === false
            ? Prisma.sql`AND is_active = true`
            : Prisma.empty
        }
        ${
          trimmedQuery.length > 0
            ? Prisma.sql`
                AND (
                  name ILIKE ${searchPattern}
                  OR COALESCE(contact_name, '') ILIKE ${searchPattern}
                  OR COALESCE(email, '') ILIKE ${searchPattern}
                  OR COALESCE(phone, '') ILIKE ${searchPattern}
                )
              `
            : Prisma.empty
        }
      ORDER BY is_active DESC, name ASC
    `);
  }

  async getSupplierById(
    businessId: string,
    supplierId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = this.getExecutor(tx);
    const rows = await executor.$queryRaw<SupplierRecord[]>(Prisma.sql`
      SELECT
        id,
        business_id AS "businessId",
        name,
        contact_name AS "contactName",
        email,
        phone,
        address,
        notes,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM suppliers
      WHERE business_id = CAST(${businessId} AS uuid)
        AND id = CAST(${supplierId} AS uuid)
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async getActiveSupplierById(
    businessId: string,
    supplierId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = this.getExecutor(tx);
    const rows = await executor.$queryRaw<SupplierRecord[]>(Prisma.sql`
      SELECT
        id,
        business_id AS "businessId",
        name,
        contact_name AS "contactName",
        email,
        phone,
        address,
        notes,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM suppliers
      WHERE business_id = CAST(${businessId} AS uuid)
        AND id = CAST(${supplierId} AS uuid)
        AND is_active = true
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async createSupplier(
    input: {
      businessId: string;
      name: string;
      contactName?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<SupplierRecord[]>(Prisma.sql`
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
        ${input.address ?? null},
        ${input.notes ?? null},
        true,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        business_id AS "businessId",
        name,
        contact_name AS "contactName",
        email,
        phone,
        address,
        notes,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0]!;
  }

  async updateSupplier(
    input: {
      businessId: string;
      supplierId: string;
      name?: string;
      contactName?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<SupplierRecord[]>(Prisma.sql`
      UPDATE suppliers
      SET
        name = COALESCE(${input.name ?? null}, name),
        contact_name = COALESCE(${input.contactName ?? null}, contact_name),
        email = COALESCE(${input.email ?? null}, email),
        phone = COALESCE(${input.phone ?? null}, phone),
        address = COALESCE(${input.address ?? null}, address),
        notes = COALESCE(${input.notes ?? null}, notes),
        updated_at = NOW()
      WHERE business_id = CAST(${input.businessId} AS uuid)
        AND id = CAST(${input.supplierId} AS uuid)
      RETURNING
        id,
        business_id AS "businessId",
        name,
        contact_name AS "contactName",
        email,
        phone,
        address,
        notes,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0] ?? null;
  }

  async setSupplierActive(
    businessId: string,
    supplierId: string,
    isActive: boolean,
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<SupplierRecord[]>(Prisma.sql`
      UPDATE suppliers
      SET
        is_active = ${isActive},
        updated_at = NOW()
      WHERE business_id = CAST(${businessId} AS uuid)
        AND id = CAST(${supplierId} AS uuid)
      RETURNING
        id,
        business_id AS "businessId",
        name,
        contact_name AS "contactName",
        email,
        phone,
        address,
        notes,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0] ?? null;
  }

  async getActiveProductsByIds(
    businessId: string,
    productIds: string[],
    tx?: PrismaExecutor,
  ) {
    if (productIds.length === 0) {
      return [];
    }

    const executor = this.getExecutor(tx);
    const productIdList = productIds.map(
      (productId) => Prisma.sql`CAST(${productId} AS uuid)`,
    );

    return executor.$queryRaw<PurchaseProductRecord[]>(Prisma.sql`
      SELECT
        p.id,
        p.name,
        p.sku,
        COALESCE(tr.rate, 0)::double precision AS "taxRate",
        COALESCE(p.is_active, false) AS "isActive"
      FROM products p
      LEFT JOIN tax_rates tr ON tr.id = p.tax_rate_id
      WHERE p.business_id = CAST(${businessId} AS uuid)
        AND p.id IN (${Prisma.join(productIdList)})
        AND COALESCE(p.is_active, true) = true
    `);
  }

  async getPurchaseOrderById(purchaseOrderId: string, tx?: PrismaExecutor) {
    const executor = this.getExecutor(tx);
    const rows = await executor.$queryRaw<PurchaseOrderRecord[]>(Prisma.sql`
      SELECT
        po.id,
        po.business_id AS "businessId",
        po.branch_id AS "branchId",
        po.supplier_id AS "supplierId",
        s.name AS "supplierName",
        s.contact_name AS "supplierContactName",
        s.email AS "supplierEmail",
        s.phone AS "supplierPhone",
        s.address AS "supplierAddress",
        po.status,
        po.ordered_by AS "orderedBy",
        op.full_name AS "orderedByName",
        po.subtotal::double precision AS subtotal,
        po.tax_total::double precision AS "taxTotal",
        po.total::double precision AS total,
        po.notes,
        po.created_at AS "createdAt",
        po.updated_at AS "updatedAt"
      FROM purchase_orders po
      INNER JOIN suppliers s ON s.id = po.supplier_id
      LEFT JOIN profiles op ON op.id = po.ordered_by
      WHERE po.id = CAST(${purchaseOrderId} AS uuid)
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async getPurchaseOrderByIdForUpdate(
    purchaseOrderId: string,
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<PurchaseOrderRecord[]>(Prisma.sql`
      SELECT
        po.id,
        po.business_id AS "businessId",
        po.branch_id AS "branchId",
        po.supplier_id AS "supplierId",
        s.name AS "supplierName",
        s.contact_name AS "supplierContactName",
        s.email AS "supplierEmail",
        s.phone AS "supplierPhone",
        s.address AS "supplierAddress",
        po.status,
        po.ordered_by AS "orderedBy",
        op.full_name AS "orderedByName",
        po.subtotal::double precision AS subtotal,
        po.tax_total::double precision AS "taxTotal",
        po.total::double precision AS total,
        po.notes,
        po.created_at AS "createdAt",
        po.updated_at AS "updatedAt"
      FROM purchase_orders po
      INNER JOIN suppliers s ON s.id = po.supplier_id
      LEFT JOIN profiles op ON op.id = po.ordered_by
      WHERE po.id = CAST(${purchaseOrderId} AS uuid)
      FOR UPDATE OF po
    `);

    return rows[0] ?? null;
  }

  async listPurchaseOrders(
    businessId: string,
    branchId: string,
    options: { query?: string; limit?: number },
    tx?: PrismaExecutor,
  ) {
    const executor = this.getExecutor(tx);
    const trimmedQuery = options.query?.trim() ?? '';
    const searchPattern = `%${trimmedQuery}%`;
    const limit = Math.min(Math.max(options.limit ?? 20, 5), 50);

    return executor.$queryRaw<PurchaseOrderListRecord[]>(Prisma.sql`
      SELECT
        po.id,
        po.business_id AS "businessId",
        po.branch_id AS "branchId",
        po.supplier_id AS "supplierId",
        s.name AS "supplierName",
        s.contact_name AS "supplierContactName",
        s.email AS "supplierEmail",
        s.phone AS "supplierPhone",
        s.address AS "supplierAddress",
        po.status,
        po.ordered_by AS "orderedBy",
        op.full_name AS "orderedByName",
        po.subtotal::double precision AS subtotal,
        po.tax_total::double precision AS "taxTotal",
        po.total::double precision AS total,
        po.notes,
        po.created_at AS "createdAt",
        po.updated_at AS "updatedAt",
        COALESCE(ordered.quantity, 0)::double precision AS "orderedQuantity",
        COALESCE(received.quantity, 0)::double precision AS "receivedQuantity",
        GREATEST(
          COALESCE(ordered.quantity, 0) - COALESCE(received.quantity, 0),
          0
        )::double precision AS "pendingQuantity",
        COALESCE(items.items_count, 0)::double precision AS "itemsCount",
        COALESCE(receipts.receipt_count, 0)::double precision AS "receiptCount"
      FROM purchase_orders po
      INNER JOIN suppliers s ON s.id = po.supplier_id
      LEFT JOIN profiles op ON op.id = po.ordered_by
      LEFT JOIN (
        SELECT
          purchase_order_id,
          SUM(quantity)::double precision AS quantity
        FROM purchase_order_items
        GROUP BY purchase_order_id
      ) ordered ON ordered.purchase_order_id = po.id
      LEFT JOIN (
        SELECT
          gr.purchase_order_id,
          SUM(gri.quantity)::double precision AS quantity
        FROM goods_receipts gr
        INNER JOIN goods_receipt_items gri ON gri.goods_receipt_id = gr.id
        WHERE gr.purchase_order_id IS NOT NULL
        GROUP BY gr.purchase_order_id
      ) received ON received.purchase_order_id = po.id
      LEFT JOIN (
        SELECT
          purchase_order_id,
          COUNT(*)::double precision AS items_count
        FROM purchase_order_items
        GROUP BY purchase_order_id
      ) items ON items.purchase_order_id = po.id
      LEFT JOIN (
        SELECT
          purchase_order_id,
          COUNT(*)::double precision AS receipt_count
        FROM goods_receipts
        WHERE purchase_order_id IS NOT NULL
        GROUP BY purchase_order_id
      ) receipts ON receipts.purchase_order_id = po.id
      WHERE po.business_id = CAST(${businessId} AS uuid)
        AND po.branch_id = CAST(${branchId} AS uuid)
        ${
          trimmedQuery.length > 0
            ? Prisma.sql`
                AND (
                  po.id::text ILIKE ${searchPattern}
                  OR s.name ILIKE ${searchPattern}
                  OR COALESCE(po.notes, '') ILIKE ${searchPattern}
                )
              `
            : Prisma.empty
        }
      ORDER BY po.created_at DESC
      LIMIT CAST(${limit} AS integer)
    `);
  }

  async getPurchaseOrderSummaryByIds(orderIds: string[], tx?: PrismaExecutor) {
    if (orderIds.length === 0) {
      return [];
    }

    const executor = this.getExecutor(tx);
    const orderIdList = orderIds.map(
      (orderId) => Prisma.sql`CAST(${orderId} AS uuid)`,
    );

    return executor.$queryRaw<PurchaseOrderSummaryRecord[]>(Prisma.sql`
      SELECT
        po.id AS "purchaseOrderId",
        COALESCE(ordered.quantity, 0)::double precision AS "orderedQuantity",
        COALESCE(received.quantity, 0)::double precision AS "receivedQuantity",
        GREATEST(
          COALESCE(ordered.quantity, 0) - COALESCE(received.quantity, 0),
          0
        )::double precision AS "pendingQuantity",
        COALESCE(receipts.receipt_count, 0)::double precision AS "receiptCount"
      FROM purchase_orders po
      LEFT JOIN (
        SELECT
          purchase_order_id,
          SUM(quantity)::double precision AS quantity
        FROM purchase_order_items
        GROUP BY purchase_order_id
      ) ordered ON ordered.purchase_order_id = po.id
      LEFT JOIN (
        SELECT
          gr.purchase_order_id,
          SUM(gri.quantity)::double precision AS quantity
        FROM goods_receipts gr
        INNER JOIN goods_receipt_items gri ON gri.goods_receipt_id = gr.id
        WHERE gr.purchase_order_id IS NOT NULL
        GROUP BY gr.purchase_order_id
      ) received ON received.purchase_order_id = po.id
      LEFT JOIN (
        SELECT
          purchase_order_id,
          COUNT(*)::double precision AS receipt_count
        FROM goods_receipts
        WHERE purchase_order_id IS NOT NULL
        GROUP BY purchase_order_id
      ) receipts ON receipts.purchase_order_id = po.id
      WHERE po.id IN (${Prisma.join(orderIdList)})
    `);
  }

  async getPurchaseOrderItems(purchaseOrderId: string, tx?: PrismaExecutor) {
    const executor = this.getExecutor(tx);
    return executor.$queryRaw<PurchaseOrderItemRecord[]>(Prisma.sql`
      SELECT
        poi.id,
        poi.purchase_order_id AS "purchaseOrderId",
        poi.product_id AS "productId",
        p.name AS "productName",
        p.sku,
        poi.quantity::double precision AS quantity,
        poi.unit_cost::double precision AS "unitCost",
        poi.tax_rate::double precision AS "taxRate",
        poi.line_total::double precision AS "lineTotal"
      FROM purchase_order_items poi
      INNER JOIN products p ON p.id = poi.product_id
      WHERE poi.purchase_order_id = CAST(${purchaseOrderId} AS uuid)
      ORDER BY poi.id ASC
    `);
  }

  async getPurchaseOrderReceivedTotalsByProductIds(
    purchaseOrderId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = this.getExecutor(tx);
    return executor.$queryRaw<PurchaseOrderReceivedProductRecord[]>(Prisma.sql`
      SELECT
        gri.product_id AS "productId",
        SUM(gri.quantity)::double precision AS "receivedQuantity"
      FROM goods_receipts gr
      INNER JOIN goods_receipt_items gri ON gri.goods_receipt_id = gr.id
      WHERE gr.purchase_order_id = CAST(${purchaseOrderId} AS uuid)
      GROUP BY gri.product_id
    `);
  }

  async createPurchaseOrderHeader(
    input: {
      businessId: string;
      branchId: string;
      supplierId: string;
      orderedBy: string;
      subtotal: number;
      taxTotal: number;
      total: number;
      notes?: string | null;
      status?: PurchaseOrderStatus;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<PurchaseOrderRecord[]>(Prisma.sql`
      INSERT INTO purchase_orders (
        business_id,
        branch_id,
        supplier_id,
        status,
        ordered_by,
        subtotal,
        tax_total,
        total,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        CAST(${input.businessId} AS uuid),
        CAST(${input.branchId} AS uuid),
        CAST(${input.supplierId} AS uuid),
        CAST(${input.status ?? PurchaseOrderStatus.DRAFT} AS purchase_order_status),
        CAST(${input.orderedBy} AS uuid),
        ${input.subtotal},
        ${input.taxTotal},
        ${input.total},
        ${input.notes ?? null},
        NOW(),
        NOW()
      )
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        supplier_id AS "supplierId",
        ''::text AS "supplierName",
        NULL::text AS "supplierContactName",
        NULL::text AS "supplierEmail",
        NULL::text AS "supplierPhone",
        NULL::text AS "supplierAddress",
        status,
        ordered_by AS "orderedBy",
        NULL::text AS "orderedByName",
        subtotal::double precision AS subtotal,
        tax_total::double precision AS "taxTotal",
        total::double precision AS total,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0]!;
  }

  async updatePurchaseOrderHeader(
    input: {
      purchaseOrderId: string;
      supplierId?: string | null;
      notes?: string | null;
      subtotal: number;
      taxTotal: number;
      total: number;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<PurchaseOrderRecord[]>(Prisma.sql`
      UPDATE purchase_orders
      SET
        supplier_id = COALESCE(CAST(${input.supplierId ?? null} AS uuid), supplier_id),
        notes = COALESCE(${input.notes ?? null}, notes),
        subtotal = ${input.subtotal},
        tax_total = ${input.taxTotal},
        total = ${input.total},
        updated_at = NOW()
      WHERE id = CAST(${input.purchaseOrderId} AS uuid)
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        supplier_id AS "supplierId",
        ''::text AS "supplierName",
        NULL::text AS "supplierContactName",
        NULL::text AS "supplierEmail",
        NULL::text AS "supplierPhone",
        NULL::text AS "supplierAddress",
        status,
        ordered_by AS "orderedBy",
        NULL::text AS "orderedByName",
        subtotal::double precision AS subtotal,
        tax_total::double precision AS "taxTotal",
        total::double precision AS total,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0] ?? null;
  }

  async updatePurchaseOrderStatus(
    purchaseOrderId: string,
    status: PurchaseOrderStatus,
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<PurchaseOrderRecord[]>(Prisma.sql`
      UPDATE purchase_orders
      SET
        status = CAST(${status} AS purchase_order_status),
        updated_at = NOW()
      WHERE id = CAST(${purchaseOrderId} AS uuid)
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        supplier_id AS "supplierId",
        ''::text AS "supplierName",
        NULL::text AS "supplierContactName",
        NULL::text AS "supplierEmail",
        NULL::text AS "supplierPhone",
        NULL::text AS "supplierAddress",
        status,
        ordered_by AS "orderedBy",
        NULL::text AS "orderedByName",
        subtotal::double precision AS subtotal,
        tax_total::double precision AS "taxTotal",
        total::double precision AS total,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return rows[0] ?? null;
  }

  async deletePurchaseOrderItems(purchaseOrderId: string, tx: PrismaExecutor) {
    await tx.$executeRaw(
      Prisma.sql`
        DELETE FROM purchase_order_items
        WHERE purchase_order_id = CAST(${purchaseOrderId} AS uuid)
      `,
    );
  }

  async createPurchaseOrderItem(
    input: {
      purchaseOrderId: string;
      productId: string;
      quantity: number;
      unitCost: number;
      taxRate: number;
      lineTotal: number;
    },
    tx: PrismaExecutor,
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO purchase_order_items (
          purchase_order_id,
          product_id,
          quantity,
          unit_cost,
          tax_rate,
          line_total
        )
        VALUES (
          CAST(${input.purchaseOrderId} AS uuid),
          CAST(${input.productId} AS uuid),
          ${input.quantity},
          ${input.unitCost},
          ${input.taxRate},
          ${input.lineTotal}
        )
      `,
    );
  }

  async createGoodsReceiptHeader(
    input: {
      businessId: string;
      branchId: string;
      locationId: string;
      purchaseOrderId: string;
      supplierId: string;
      receivedBy: string;
      notes?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<PurchaseOrderReceiptRecord[]>(Prisma.sql`
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
        CAST(${input.purchaseOrderId} AS uuid),
        CAST(${input.receivedBy} AS uuid),
        CAST(${input.supplierId} AS uuid),
        ${input.notes ?? null},
        NOW()
      )
      RETURNING
        id,
        business_id AS "businessId",
        branch_id AS "branchId",
        purchase_order_id AS "purchaseOrderId",
        NULL::timestamp with time zone AS "purchaseOrderCreatedAt",
        location_id AS "locationId",
        ''::text AS "locationName",
        supplier_id AS "supplierId",
        NULL::text AS "supplierName",
        received_by AS "receivedBy",
        NULL::text AS "receivedByName",
        notes,
        created_at AS "createdAt",
        0::double precision AS "itemsCount",
        0::double precision AS "totalQuantity",
        0::double precision AS "totalCost",
        NULL::text AS "purchaseOrderStatus"
    `);

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

  async getGoodsReceiptById(goodsReceiptId: string, tx?: PrismaExecutor) {
    const executor = this.getExecutor(tx);
    const rows = await executor.$queryRaw<PurchaseOrderReceiptRecord[]>(
      Prisma.sql`
        SELECT
          gr.id,
          gr.business_id AS "businessId",
          gr.branch_id AS "branchId",
          gr.purchase_order_id AS "purchaseOrderId",
          po.created_at AS "purchaseOrderCreatedAt",
          gr.location_id AS "locationId",
          il.name AS "locationName",
          gr.supplier_id AS "supplierId",
          s.name AS "supplierName",
          gr.received_by AS "receivedBy",
          p.full_name AS "receivedByName",
          gr.notes,
          gr.created_at AS "createdAt",
          COALESCE(total_items.items_count, 0)::double precision AS "itemsCount",
          COALESCE(total_qty.quantity, 0)::double precision AS "totalQuantity",
          COALESCE(total_cost.total_cost, 0)::double precision AS "totalCost",
          po.status AS "purchaseOrderStatus"
        FROM goods_receipts gr
        INNER JOIN inventory_locations il ON il.id = gr.location_id
        LEFT JOIN suppliers s ON s.id = gr.supplier_id
        LEFT JOIN profiles p ON p.id = gr.received_by
        LEFT JOIN purchase_orders po ON po.id = gr.purchase_order_id
        LEFT JOIN (
          SELECT
            goods_receipt_id,
            COUNT(*)::double precision AS items_count
          FROM goods_receipt_items
          GROUP BY goods_receipt_id
        ) total_items ON total_items.goods_receipt_id = gr.id
        LEFT JOIN (
          SELECT
            goods_receipt_id,
            SUM(quantity)::double precision AS quantity
          FROM goods_receipt_items
          GROUP BY goods_receipt_id
        ) total_qty ON total_qty.goods_receipt_id = gr.id
        LEFT JOIN (
          SELECT
            goods_receipt_id,
            SUM(quantity * unit_cost)::double precision AS total_cost
          FROM goods_receipt_items
          GROUP BY goods_receipt_id
        ) total_cost ON total_cost.goods_receipt_id = gr.id
        WHERE gr.id = CAST(${goodsReceiptId} AS uuid)
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  async getGoodsReceiptItems(goodsReceiptId: string, tx?: PrismaExecutor) {
    const executor = this.getExecutor(tx);
    return executor.$queryRaw<PurchaseOrderReceiptItemRecord[]>(Prisma.sql`
      SELECT
        gri.id,
        gri.goods_receipt_id AS "goodsReceiptId",
        gri.product_id AS "productId",
        p.name AS "productName",
        p.sku,
        gri.quantity::double precision AS quantity,
        gri.unit_cost::double precision AS "unitCost"
      FROM goods_receipt_items gri
      INNER JOIN products p ON p.id = gri.product_id
      WHERE gri.goods_receipt_id = CAST(${goodsReceiptId} AS uuid)
      ORDER BY gri.id ASC
    `);
  }

  async getGoodsReceiptItemsByReceiptIds(
    goodsReceiptIds: string[],
    tx?: PrismaExecutor,
  ) {
    if (goodsReceiptIds.length === 0) {
      return [];
    }

    const executor = this.getExecutor(tx);
    const receiptIdList = goodsReceiptIds.map(
      (goodsReceiptId) => Prisma.sql`CAST(${goodsReceiptId} AS uuid)`,
    );

    return executor.$queryRaw<PurchaseOrderReceiptItemRecord[]>(Prisma.sql`
      SELECT
        gri.id,
        gri.goods_receipt_id AS "goodsReceiptId",
        gri.product_id AS "productId",
        p.name AS "productName",
        p.sku,
        gri.quantity::double precision AS quantity,
        gri.unit_cost::double precision AS "unitCost"
      FROM goods_receipt_items gri
      INNER JOIN products p ON p.id = gri.product_id
      WHERE gri.goods_receipt_id IN (${Prisma.join(receiptIdList)})
      ORDER BY gri.goods_receipt_id ASC, gri.id ASC
    `);
  }

  async listGoodsReceipts(
    businessId: string,
    branchId: string,
    options: { query?: string; limit?: number },
    tx?: PrismaExecutor,
  ) {
    const executor = this.getExecutor(tx);
    const trimmedQuery = options.query?.trim() ?? '';
    const searchPattern = `%${trimmedQuery}%`;
    const limit = Math.min(Math.max(options.limit ?? 20, 5), 50);

    return executor.$queryRaw<PurchaseOrderReceiptListRecord[]>(Prisma.sql`
      SELECT
        gr.id,
        gr.business_id AS "businessId",
        gr.branch_id AS "branchId",
        gr.purchase_order_id AS "purchaseOrderId",
        po.created_at AS "purchaseOrderCreatedAt",
        gr.location_id AS "locationId",
        il.name AS "locationName",
        gr.supplier_id AS "supplierId",
        s.name AS "supplierName",
        gr.received_by AS "receivedBy",
        p.full_name AS "receivedByName",
        gr.notes,
        gr.created_at AS "createdAt",
        COALESCE(total_items.items_count, 0)::double precision AS "itemsCount",
        COALESCE(total_qty.quantity, 0)::double precision AS "totalQuantity",
        COALESCE(total_cost.total_cost, 0)::double precision AS "totalCost",
        po.status AS "purchaseOrderStatus"
      FROM goods_receipts gr
      INNER JOIN inventory_locations il ON il.id = gr.location_id
      LEFT JOIN suppliers s ON s.id = gr.supplier_id
      LEFT JOIN profiles p ON p.id = gr.received_by
      LEFT JOIN purchase_orders po ON po.id = gr.purchase_order_id
      LEFT JOIN (
        SELECT
          goods_receipt_id,
          COUNT(*)::double precision AS items_count
        FROM goods_receipt_items
        GROUP BY goods_receipt_id
      ) total_items ON total_items.goods_receipt_id = gr.id
      LEFT JOIN (
        SELECT
          goods_receipt_id,
          SUM(quantity)::double precision AS quantity
        FROM goods_receipt_items
        GROUP BY goods_receipt_id
      ) total_qty ON total_qty.goods_receipt_id = gr.id
      LEFT JOIN (
        SELECT
          goods_receipt_id,
          SUM(quantity * unit_cost)::double precision AS total_cost
        FROM goods_receipt_items
        GROUP BY goods_receipt_id
      ) total_cost ON total_cost.goods_receipt_id = gr.id
      WHERE gr.business_id = CAST(${businessId} AS uuid)
        AND gr.branch_id = CAST(${branchId} AS uuid)
        ${
          trimmedQuery.length > 0
            ? Prisma.sql`
                AND (
                  gr.id::text ILIKE ${searchPattern}
                  OR COALESCE(s.name, '') ILIKE ${searchPattern}
                  OR COALESCE(il.name, '') ILIKE ${searchPattern}
                )
              `
            : Prisma.empty
        }
      ORDER BY gr.created_at DESC
      LIMIT CAST(${limit} AS integer)
    `);
  }

  async getGoodsReceiptsByPurchaseOrderId(
    purchaseOrderId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = this.getExecutor(tx);
    return executor.$queryRaw<PurchaseOrderReceiptListRecord[]>(Prisma.sql`
      SELECT
        gr.id,
        gr.business_id AS "businessId",
        gr.branch_id AS "branchId",
        gr.purchase_order_id AS "purchaseOrderId",
        po.created_at AS "purchaseOrderCreatedAt",
        gr.location_id AS "locationId",
        il.name AS "locationName",
        gr.supplier_id AS "supplierId",
        s.name AS "supplierName",
        gr.received_by AS "receivedBy",
        p.full_name AS "receivedByName",
        gr.notes,
        gr.created_at AS "createdAt",
        COALESCE(total_items.items_count, 0)::double precision AS "itemsCount",
        COALESCE(total_qty.quantity, 0)::double precision AS "totalQuantity",
        COALESCE(total_cost.total_cost, 0)::double precision AS "totalCost",
        po.status AS "purchaseOrderStatus"
      FROM goods_receipts gr
      INNER JOIN inventory_locations il ON il.id = gr.location_id
      LEFT JOIN suppliers s ON s.id = gr.supplier_id
      LEFT JOIN profiles p ON p.id = gr.received_by
      LEFT JOIN purchase_orders po ON po.id = gr.purchase_order_id
      LEFT JOIN (
        SELECT
          goods_receipt_id,
          COUNT(*)::double precision AS items_count
        FROM goods_receipt_items
        GROUP BY goods_receipt_id
      ) total_items ON total_items.goods_receipt_id = gr.id
      LEFT JOIN (
        SELECT
          goods_receipt_id,
          SUM(quantity)::double precision AS quantity
        FROM goods_receipt_items
        GROUP BY goods_receipt_id
      ) total_qty ON total_qty.goods_receipt_id = gr.id
      LEFT JOIN (
        SELECT
          goods_receipt_id,
          SUM(quantity * unit_cost)::double precision AS total_cost
        FROM goods_receipt_items
        GROUP BY goods_receipt_id
      ) total_cost ON total_cost.goods_receipt_id = gr.id
      WHERE gr.purchase_order_id = CAST(${purchaseOrderId} AS uuid)
      ORDER BY gr.created_at ASC, gr.id ASC
    `);
  }

  async getGoodsReceiptSummaryByIds(
    goodsReceiptIds: string[],
    tx?: PrismaExecutor,
  ) {
    if (goodsReceiptIds.length === 0) {
      return [];
    }

    const executor = this.getExecutor(tx);
    const receiptIdList = goodsReceiptIds.map(
      (goodsReceiptId) => Prisma.sql`CAST(${goodsReceiptId} AS uuid)`,
    );

    return executor.$queryRaw<PurchaseOrderReceiptListRecord[]>(Prisma.sql`
      SELECT
        gr.id,
        gr.business_id AS "businessId",
        gr.branch_id AS "branchId",
        gr.purchase_order_id AS "purchaseOrderId",
        po.created_at AS "purchaseOrderCreatedAt",
        gr.location_id AS "locationId",
        il.name AS "locationName",
        gr.supplier_id AS "supplierId",
        s.name AS "supplierName",
        gr.received_by AS "receivedBy",
        p.full_name AS "receivedByName",
        gr.notes,
        gr.created_at AS "createdAt",
        COALESCE(total_items.items_count, 0)::double precision AS "itemsCount",
        COALESCE(total_qty.quantity, 0)::double precision AS "totalQuantity",
        COALESCE(total_cost.total_cost, 0)::double precision AS "totalCost",
        po.status AS "purchaseOrderStatus"
      FROM goods_receipts gr
      INNER JOIN inventory_locations il ON il.id = gr.location_id
      LEFT JOIN suppliers s ON s.id = gr.supplier_id
      LEFT JOIN profiles p ON p.id = gr.received_by
      LEFT JOIN purchase_orders po ON po.id = gr.purchase_order_id
      LEFT JOIN (
        SELECT
          goods_receipt_id,
          COUNT(*)::double precision AS items_count
        FROM goods_receipt_items
        GROUP BY goods_receipt_id
      ) total_items ON total_items.goods_receipt_id = gr.id
      LEFT JOIN (
        SELECT
          goods_receipt_id,
          SUM(quantity)::double precision AS quantity
        FROM goods_receipt_items
        GROUP BY goods_receipt_id
      ) total_qty ON total_qty.goods_receipt_id = gr.id
      LEFT JOIN (
        SELECT
          goods_receipt_id,
          SUM(quantity * unit_cost)::double precision AS total_cost
        FROM goods_receipt_items
        GROUP BY goods_receipt_id
      ) total_cost ON total_cost.goods_receipt_id = gr.id
      WHERE gr.id IN (${Prisma.join(receiptIdList)})
      ORDER BY gr.created_at DESC, gr.id DESC
    `);
  }

  async getStockBalanceForUpdate(
    input: {
      businessId: string;
      branchId: string;
      locationId: string;
      productId: string;
    },
    tx: PrismaExecutor,
  ) {
    const rows = await tx.$queryRaw<Array<{ quantity: number }>>(Prisma.sql`
      SELECT quantity::double precision AS quantity
      FROM stock_balances
      WHERE business_id = CAST(${input.businessId} AS uuid)
        AND branch_id = CAST(${input.branchId} AS uuid)
        AND location_id = CAST(${input.locationId} AS uuid)
        AND product_id = CAST(${input.productId} AS uuid)
      FOR UPDATE
    `);

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
      movementType: string;
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

  async getInventoryLocationById(
    businessId: string,
    branchId: string,
    locationId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = this.getExecutor(tx);
    const rows = await executor.$queryRaw<Array<{ id: string; name: string }>>(
      Prisma.sql`
        SELECT id, name
        FROM inventory_locations
        WHERE business_id = CAST(${businessId} AS uuid)
          AND branch_id = CAST(${branchId} AS uuid)
          AND id = CAST(${locationId} AS uuid)
          AND is_active = true
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }
}
