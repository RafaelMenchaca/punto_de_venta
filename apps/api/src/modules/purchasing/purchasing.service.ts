import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import { PurchaseOrderStatus } from '../../common/enums/purchase-order-status.enum';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { StockService } from '../shared-db/stock.service';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListPurchaseOrdersDto } from './dto/list-purchase-orders.dto';
import { ListSuppliersDto } from './dto/list-suppliers.dto';
import { SetSupplierActiveDto } from './dto/set-supplier-active.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import {
  buildGoodsReceiptFolio,
  buildPurchaseOrderFolio,
  roundCurrency,
  roundQuantity,
} from './purchasing.utils';
import {
  PurchasingRepository,
  type PurchaseOrderItemSummaryRecord,
  type PurchaseOrderReceiptItemRecord,
  type PurchaseOrderReceiptRecord,
  type PurchaseOrderRecord,
  type SupplierRecord,
} from './purchasing.repository';

const QUANTITY_EPSILON = 0.0005;

type PurchaseOrderDetailResponse = {
  id: string;
  folio: string;
  businessId: string;
  branchId: string;
  supplier: {
    id: string;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  status: string;
  orderedByName: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  canEdit: boolean;
  canSubmit: boolean;
  canCancel: boolean;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string | null;
    quantity: number;
    receivedQuantity: number;
    pendingQuantity: number;
    unitCost: number;
    taxRate: number;
    subtotal: number;
    taxTotal: number;
    total: number;
  }>;
  receipts: Array<{
    id: string;
    folio: string;
    purchaseOrderId: string | null;
    purchaseOrderFolio: string | null;
    supplierId: string | null;
    locationId: string;
    locationName: string;
    supplierName: string | null;
    receivedByName: string | null;
    notes: string | null;
    createdAt: Date;
    itemsCount: number;
    totalQuantity: number;
    totalCost: number;
    items: Array<{
      id: string;
      purchaseOrderItemId: string | null;
      goodsReceiptId: string;
      productId: string;
      productName: string;
      sku: string | null;
      quantity: number;
      unitCost: number;
      lineTotal: number;
    }>;
  }>;
};

type GoodsReceiptDetailResponse = {
  id: string;
  folio: string;
  businessId: string;
  branchId: string;
  purchaseOrderId: string | null;
  purchaseOrderFolio: string | null;
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
  purchaseOrderStatus: string | null;
  items: Array<{
    id: string;
    purchaseOrderItemId: string | null;
    goodsReceiptId: string;
    productId: string;
    productName: string;
    sku: string | null;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
};

@Injectable()
export class PurchasingService {
  constructor(
    private readonly auditService: AuditService,
    private readonly businessAccessService: BusinessAccessService,
    private readonly prisma: PrismaService,
    private readonly purchasingRepository: PurchasingRepository,
    private readonly stockService: StockService,
  ) {}

  private isDuplicateKeyError(error: unknown) {
    return error instanceof Error && /duplicate key value/i.test(error.message);
  }

  private assertPurchaseOrderAccess(
    order: { businessId: string; branchId: string },
    user: RequestUser,
  ) {
    return Promise.all([
      this.businessAccessService.assertBusinessMembership(
        user.id,
        order.businessId,
      ),
      this.businessAccessService.assertBranchAccess(
        user.id,
        order.businessId,
        order.branchId,
      ),
    ]);
  }

  private buildSupplierResponse(record: SupplierRecord) {
    return {
      id: record.id,
      businessId: record.businessId,
      name: record.name,
      contactName: record.contactName,
      email: record.email,
      phone: record.phone,
      address: record.address,
      notes: record.notes,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async listSuppliers(query: ListSuppliersDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );

    const suppliers = await this.purchasingRepository.listSuppliers(
      query.business_id,
      {
        query: query.query,
        includeInactive: query.include_inactive,
      },
    );

    return suppliers.map((supplier) => this.buildSupplierResponse(supplier));
  }

  async createSupplier(input: CreateSupplierDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const supplier = await this.purchasingRepository.createSupplier(
          {
            businessId: input.business_id,
            name: input.name.trim(),
            contactName: input.contact_name?.trim() || null,
            email: input.email?.trim() || null,
            phone: input.phone?.trim() || null,
            address: input.address?.trim() || null,
            notes: input.notes?.trim() || null,
          },
          tx,
        );

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'create_supplier',
          entityType: 'supplier',
          entityId: supplier.id,
          afterJson: supplier,
          tx,
        });

        return this.buildSupplierResponse(supplier);
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Ya existe un proveedor con ese nombre.');
      }

      throw error;
    }
  }

  async updateSupplier(
    supplierId: string,
    input: UpdateSupplierDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );

    const currentSupplier = await this.purchasingRepository.getSupplierById(
      input.business_id,
      supplierId,
    );

    if (!currentSupplier) {
      throw new NotFoundException('Proveedor no encontrado.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const supplier = await this.purchasingRepository.updateSupplier(
          {
            businessId: input.business_id,
            supplierId,
            name: input.name?.trim(),
            contactName: input.contact_name?.trim() || null,
            email: input.email?.trim() || null,
            phone: input.phone?.trim() || null,
            address: input.address?.trim() || null,
            notes: input.notes?.trim() || null,
          },
          tx,
        );

        if (!supplier) {
          throw new NotFoundException('Proveedor no encontrado.');
        }

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'update_supplier',
          entityType: 'supplier',
          entityId: supplier.id,
          beforeJson: currentSupplier,
          afterJson: supplier,
          tx,
        });

        return this.buildSupplierResponse(supplier);
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Ya existe un proveedor con ese nombre.');
      }

      throw error;
    }
  }

  async setSupplierActive(
    supplierId: string,
    input: SetSupplierActiveDto,
    user: RequestUser,
    isActive: boolean,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );

    const currentSupplier = await this.purchasingRepository.getSupplierById(
      input.business_id,
      supplierId,
    );

    if (!currentSupplier) {
      throw new NotFoundException('Proveedor no encontrado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const supplier = await this.purchasingRepository.setSupplierActive(
        input.business_id,
        supplierId,
        isActive,
        tx,
      );

      if (!supplier) {
        throw new NotFoundException('Proveedor no encontrado.');
      }

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: isActive ? 'reactivate_supplier' : 'deactivate_supplier',
        entityType: 'supplier',
        entityId: supplier.id,
        beforeJson: currentSupplier,
        afterJson: supplier,
        tx,
      });

      return this.buildSupplierResponse(supplier);
    });
  }

  private calculateOrderTotals(
    items: Array<{
      quantity: number;
      unitCost: number;
      taxRate: number;
    }>,
  ) {
    const subtotal = roundCurrency(
      items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    );
    const taxTotal = roundCurrency(
      items.reduce(
        (sum, item) =>
          sum + item.quantity * item.unitCost * (item.taxRate / 100),
        0,
      ),
    );

    return {
      subtotal,
      taxTotal,
      total: roundCurrency(subtotal + taxTotal),
    };
  }

  private buildPurchaseOrderItemResponse(item: PurchaseOrderItemSummaryRecord) {
    const subtotal = roundCurrency(item.lineTotal);
    const taxTotal = roundCurrency(subtotal * (item.taxRate / 100));

    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity,
      pendingQuantity: item.pendingQuantity,
      unitCost: item.unitCost,
      taxRate: item.taxRate,
      subtotal,
      taxTotal,
      total: roundCurrency(subtotal + taxTotal),
    };
  }

  private buildGoodsReceiptItemResponse(item: PurchaseOrderReceiptItemRecord) {
    return {
      id: item.id,
      purchaseOrderItemId: null,
      goodsReceiptId: item.goodsReceiptId,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitCost: item.unitCost,
      lineTotal: roundCurrency(item.quantity * item.unitCost),
    };
  }

  private buildGoodsReceiptSummaryResponse(
    receipt: PurchaseOrderReceiptRecord,
    items: PurchaseOrderReceiptItemRecord[] = [],
  ) {
    const purchaseOrderFolio =
      receipt.purchaseOrderId && receipt.purchaseOrderCreatedAt
        ? buildPurchaseOrderFolio(
            receipt.purchaseOrderId,
            receipt.purchaseOrderCreatedAt,
          )
        : null;

    return {
      id: receipt.id,
      folio: buildGoodsReceiptFolio(receipt.id, receipt.createdAt),
      purchaseOrderId: receipt.purchaseOrderId,
      purchaseOrderFolio,
      businessId: receipt.businessId,
      branchId: receipt.branchId,
      locationId: receipt.locationId,
      locationName: receipt.locationName,
      supplierId: receipt.supplierId,
      supplierName: receipt.supplierName,
      receivedBy: receipt.receivedBy,
      receivedByName: receipt.receivedByName,
      notes: receipt.notes,
      createdAt: receipt.createdAt,
      itemsCount: receipt.itemsCount,
      totalQuantity: receipt.totalQuantity,
      totalCost: receipt.totalCost,
      purchaseOrderStatus: receipt.purchaseOrderStatus,
      items: items.map((item) => this.buildGoodsReceiptItemResponse(item)),
    };
  }

  private buildPurchaseOrderDetailResponse(
    order: PurchaseOrderRecord,
    items: PurchaseOrderItemSummaryRecord[],
    receipts: Array<
      PurchaseOrderReceiptRecord & {
        items: PurchaseOrderReceiptItemRecord[];
      }
    >,
  ): PurchaseOrderDetailResponse {
    const orderedQuantity = roundQuantity(
      items.reduce((sum, item) => sum + item.quantity, 0),
    );
    const receivedQuantity = roundQuantity(
      items.reduce((sum, item) => sum + item.receivedQuantity, 0),
    );
    const pendingQuantity = roundQuantity(
      items.reduce((sum, item) => sum + item.pendingQuantity, 0),
    );

    return {
      id: order.id,
      folio: buildPurchaseOrderFolio(order.id, order.createdAt),
      businessId: order.businessId,
      branchId: order.branchId,
      supplier: {
        id: order.supplierId,
        name: order.supplierName,
        contactName: order.supplierContactName,
        email: order.supplierEmail,
        phone: order.supplierPhone,
        address: order.supplierAddress,
      },
      status: order.status,
      orderedByName: order.orderedByName,
      subtotal: order.subtotal,
      taxTotal: order.taxTotal,
      total: order.total,
      orderedQuantity,
      receivedQuantity,
      pendingQuantity,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      canEdit: order.status === PurchaseOrderStatus.DRAFT,
      canSubmit: order.status === PurchaseOrderStatus.DRAFT,
      canCancel:
        (order.status === PurchaseOrderStatus.DRAFT ||
          order.status === PurchaseOrderStatus.SUBMITTED) &&
        receivedQuantity <= QUANTITY_EPSILON,
      items: items.map((item) => this.buildPurchaseOrderItemResponse(item)),
      receipts: receipts.map((receipt) =>
        this.buildGoodsReceiptSummaryResponse(receipt, receipt.items),
      ),
    };
  }

  private buildGoodsReceiptDetailResponse(
    receipt: PurchaseOrderReceiptRecord,
    items: PurchaseOrderReceiptItemRecord[],
  ): GoodsReceiptDetailResponse {
    return this.buildGoodsReceiptSummaryResponse(receipt, items);
  }

  async listPurchaseOrders(query: ListPurchaseOrdersDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );

    const orders = await this.purchasingRepository.listPurchaseOrders(
      query.business_id,
      query.branch_id,
      {
        query: query.query,
        limit: query.limit,
      },
    );

    return orders.map((order) => ({
      id: order.id,
      folio: buildPurchaseOrderFolio(order.id, order.createdAt),
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      orderedByName: order.orderedByName,
      status: order.status,
      subtotal: order.subtotal,
      taxTotal: order.taxTotal,
      total: order.total,
      orderedQuantity: order.orderedQuantity,
      receivedQuantity: order.receivedQuantity,
      pendingQuantity: order.pendingQuantity,
      itemsCount: order.itemsCount,
      receiptCount: order.receiptCount,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      canEdit: order.status === PurchaseOrderStatus.DRAFT,
      canSubmit: order.status === PurchaseOrderStatus.DRAFT,
      canCancel:
        (order.status === PurchaseOrderStatus.DRAFT ||
          order.status === PurchaseOrderStatus.SUBMITTED) &&
        order.receivedQuantity <= QUANTITY_EPSILON,
    }));
  }

  private normalizePurchaseOrderItems(
    inputItems: Array<
      | NonNullable<CreatePurchaseOrderDto['items']>[number]
      | NonNullable<UpdatePurchaseOrderDto['items']>[number]
    >,
    products: Array<{ id: string; taxRate: number }>,
  ) {
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    return inputItems.map((item) => {
      const product = productsById.get(item.product_id);

      if (!product) {
        throw new NotFoundException(
          'Uno de los productos no existe o ya no esta activo.',
        );
      }

      const quantity = roundQuantity(item.quantity);
      const unitCost = roundCurrency(item.unit_cost);
      const taxRate = roundCurrency(item.tax_rate ?? product.taxRate);

      return {
        productId: product.id,
        quantity,
        unitCost,
        taxRate,
        lineTotal: roundCurrency(quantity * unitCost),
      };
    });
  }

  async createPurchaseOrder(input: CreatePurchaseOrderDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      input.business_id,
      input.branch_id,
    );

    const supplier = await this.purchasingRepository.getActiveSupplierById(
      input.business_id,
      input.supplier_id,
    );

    if (!supplier) {
      throw new NotFoundException('El proveedor seleccionado no esta activo.');
    }

    const uniqueProductIds = [
      ...new Set(input.items.map((item) => item.product_id)),
    ];

    if (uniqueProductIds.length !== input.items.length) {
      throw new BadRequestException(
        'No repitas el mismo producto dentro de la orden.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const products = await this.purchasingRepository.getActiveProductsByIds(
        input.business_id,
        uniqueProductIds,
        tx,
      );

      if (products.length !== uniqueProductIds.length) {
        throw new NotFoundException(
          'Uno o mas productos no existen o ya no estan activos.',
        );
      }

      const normalizedItems = this.normalizePurchaseOrderItems(
        input.items,
        products,
      );
      const totals = this.calculateOrderTotals(normalizedItems);

      const order = await this.purchasingRepository.createPurchaseOrderHeader(
        {
          businessId: input.business_id,
          branchId: input.branch_id,
          supplierId: supplier.id,
          orderedBy: user.id,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          notes: input.notes?.trim() || null,
          status: PurchaseOrderStatus.DRAFT,
        },
        tx,
      );

      for (const item of normalizedItems) {
        await this.purchasingRepository.createPurchaseOrderItem(
          {
            purchaseOrderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
          },
          tx,
        );
      }

      const response = await this.getPurchaseOrderDetail(order.id, user, tx);

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'create_purchase_order',
        entityType: 'purchase_order',
        entityId: order.id,
        afterJson: response,
        tx,
      });

      return response;
    });
  }

  async getPurchaseOrderDetail(
    purchaseOrderId: string,
    user: RequestUser,
    tx?: Parameters<PurchasingRepository['getPurchaseOrderById']>[1],
  ) {
    const order = await this.purchasingRepository.getPurchaseOrderById(
      purchaseOrderId,
      tx,
    );

    if (!order) {
      throw new NotFoundException('La orden de compra no existe.');
    }

    await this.assertPurchaseOrderAccess(order, user);

    const items = await this.purchasingRepository.getPurchaseOrderItems(
      purchaseOrderId,
      tx,
    );
    const receivedTotals =
      await this.purchasingRepository.getPurchaseOrderReceivedTotalsByProductIds(
        purchaseOrderId,
        tx,
      );
    const receipts =
      await this.purchasingRepository.getGoodsReceiptsByPurchaseOrderId(
        purchaseOrderId,
        tx,
      );

    const receivedByProduct = new Map<string, number>();
    for (const row of receivedTotals) {
      receivedByProduct.set(row.productId, row.receivedQuantity);
    }

    const summarizedItems: PurchaseOrderItemSummaryRecord[] = items.map(
      (item) => {
        const receivedQuantity = roundQuantity(
          receivedByProduct.get(item.productId) ?? 0,
        );

        return {
          ...item,
          receivedQuantity,
          pendingQuantity: roundQuantity(
            Math.max(item.quantity - receivedQuantity, 0),
          ),
        };
      },
    );

    const receiptRows = receipts.map((receipt) => ({
      ...receipt,
      items: [] as PurchaseOrderReceiptItemRecord[],
    }));

    const receiptItems =
      await this.purchasingRepository.getGoodsReceiptItemsByReceiptIds(
        receiptRows.map((receipt) => receipt.id),
        tx,
      );

    const receiptItemsById = new Map<
      string,
      PurchaseOrderReceiptItemRecord[]
    >();
    for (const item of receiptItems) {
      const currentItems = receiptItemsById.get(item.goodsReceiptId) ?? [];
      currentItems.push(item);
      receiptItemsById.set(item.goodsReceiptId, currentItems);
    }

    const receiptsWithItems = receiptRows.map((receipt) => ({
      ...receipt,
      items: receiptItemsById.get(receipt.id) ?? [],
    }));

    return this.buildPurchaseOrderDetailResponse(
      order,
      summarizedItems,
      receiptsWithItems,
    );
  }

  async updatePurchaseOrder(
    purchaseOrderId: string,
    input: UpdatePurchaseOrderDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      input.business_id,
      input.branch_id,
    );

    const supplierId = input.supplier_id ?? null;

    if (supplierId) {
      const supplier = await this.purchasingRepository.getActiveSupplierById(
        input.business_id,
        supplierId,
      );

      if (!supplier) {
        throw new NotFoundException(
          'El proveedor seleccionado no esta activo.',
        );
      }
    }

    const currentOrder =
      await this.purchasingRepository.getPurchaseOrderById(purchaseOrderId);

    if (!currentOrder) {
      throw new NotFoundException('La orden de compra no existe.');
    }

    await this.assertPurchaseOrderAccess(currentOrder, user);

    if (currentOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Solo puedes editar una orden en borrador.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const lockedOrder =
        await this.purchasingRepository.getPurchaseOrderByIdForUpdate(
          purchaseOrderId,
          tx,
        );

      if (!lockedOrder) {
        throw new NotFoundException('La orden de compra no existe.');
      }

      if (lockedOrder.status !== PurchaseOrderStatus.DRAFT) {
        throw new BadRequestException(
          'Solo puedes editar una orden en borrador.',
        );
      }

      const nextSupplierId = supplierId ?? lockedOrder.supplierId;
      const nextNotes = input.notes?.trim() ?? lockedOrder.notes;

      if (input.items) {
        const uniqueProductIds = [
          ...new Set(input.items.map((item) => item.product_id)),
        ];

        if (uniqueProductIds.length !== input.items.length) {
          throw new BadRequestException(
            'No repitas el mismo producto dentro de la orden.',
          );
        }

        const products = await this.purchasingRepository.getActiveProductsByIds(
          input.business_id,
          uniqueProductIds,
          tx,
        );

        if (products.length !== uniqueProductIds.length) {
          throw new NotFoundException(
            'Uno o mas productos no existen o ya no estan activos.',
          );
        }

        const normalizedItems = this.normalizePurchaseOrderItems(
          input.items,
          products,
        );
        const totals = this.calculateOrderTotals(normalizedItems);

        await this.purchasingRepository.deletePurchaseOrderItems(
          purchaseOrderId,
          tx,
        );

        for (const item of normalizedItems) {
          await this.purchasingRepository.createPurchaseOrderItem(
            {
              purchaseOrderId,
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              taxRate: item.taxRate,
              lineTotal: item.lineTotal,
            },
            tx,
          );
        }

        await this.purchasingRepository.updatePurchaseOrderHeader(
          {
            purchaseOrderId,
            supplierId: nextSupplierId,
            notes: nextNotes,
            subtotal: totals.subtotal,
            taxTotal: totals.taxTotal,
            total: totals.total,
          },
          tx,
        );
      } else {
        await this.purchasingRepository.updatePurchaseOrderHeader(
          {
            purchaseOrderId,
            supplierId: nextSupplierId,
            notes: nextNotes,
            subtotal: lockedOrder.subtotal,
            taxTotal: lockedOrder.taxTotal,
            total: lockedOrder.total,
          },
          tx,
        );
      }

      const response = await this.getPurchaseOrderDetail(
        purchaseOrderId,
        user,
        tx,
      );

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'update_purchase_order',
        entityType: 'purchase_order',
        entityId: purchaseOrderId,
        beforeJson: lockedOrder,
        afterJson: response,
        tx,
      });

      return response;
    });
  }

  async submitPurchaseOrder(purchaseOrderId: string, user: RequestUser) {
    return this.prisma.$transaction(async (tx) => {
      const order =
        await this.purchasingRepository.getPurchaseOrderByIdForUpdate(
          purchaseOrderId,
          tx,
        );

      if (!order) {
        throw new NotFoundException('La orden de compra no existe.');
      }

      await this.assertPurchaseOrderAccess(order, user);

      if (order.status !== PurchaseOrderStatus.DRAFT) {
        throw new BadRequestException(
          'Solo puedes enviar una orden que siga en borrador.',
        );
      }

      const submitted =
        await this.purchasingRepository.updatePurchaseOrderStatus(
          purchaseOrderId,
          PurchaseOrderStatus.SUBMITTED,
          tx,
        );

      if (!submitted) {
        throw new NotFoundException('La orden de compra no existe.');
      }

      const response = await this.getPurchaseOrderDetail(
        purchaseOrderId,
        user,
        tx,
      );

      await this.auditService.logAction({
        businessId: order.businessId,
        actorUserId: user.id,
        action: 'submit_purchase_order',
        entityType: 'purchase_order',
        entityId: purchaseOrderId,
        beforeJson: order,
        afterJson: response,
        tx,
      });

      return response;
    });
  }

  async cancelPurchaseOrder(purchaseOrderId: string, user: RequestUser) {
    return this.prisma.$transaction(async (tx) => {
      const order =
        await this.purchasingRepository.getPurchaseOrderByIdForUpdate(
          purchaseOrderId,
          tx,
        );

      if (!order) {
        throw new NotFoundException('La orden de compra no existe.');
      }

      await this.assertPurchaseOrderAccess(order, user);

      if (order.status === PurchaseOrderStatus.CANCELLED) {
        throw new BadRequestException('La orden ya fue cancelada.');
      }

      if (
        order.status !== PurchaseOrderStatus.DRAFT &&
        order.status !== PurchaseOrderStatus.SUBMITTED
      ) {
        throw new BadRequestException(
          'Solo puedes cancelar una orden que siga abierta.',
        );
      }

      const receivedTotals =
        await this.purchasingRepository.getPurchaseOrderSummaryByIds(
          [purchaseOrderId],
          tx,
        );
      const summary = receivedTotals[0];

      if ((summary?.receivedQuantity ?? 0) > QUANTITY_EPSILON) {
        throw new BadRequestException(
          'No puedes cancelar una orden que ya tiene recepciones.',
        );
      }

      const cancelled =
        await this.purchasingRepository.updatePurchaseOrderStatus(
          purchaseOrderId,
          PurchaseOrderStatus.CANCELLED,
          tx,
        );

      if (!cancelled) {
        throw new NotFoundException('La orden de compra no existe.');
      }

      const response = await this.getPurchaseOrderDetail(
        purchaseOrderId,
        user,
        tx,
      );

      await this.auditService.logAction({
        businessId: order.businessId,
        actorUserId: user.id,
        action: 'cancel_purchase_order',
        entityType: 'purchase_order',
        entityId: purchaseOrderId,
        beforeJson: order,
        afterJson: response,
        tx,
      });

      return response;
    });
  }

  async listGoodsReceipts(query: ListPurchaseOrdersDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );

    const receipts = await this.purchasingRepository.listGoodsReceipts(
      query.business_id,
      query.branch_id,
      {
        query: query.query,
        limit: query.limit,
      },
    );

    return receipts.map((receipt) =>
      this.buildGoodsReceiptSummaryResponse(receipt),
    );
  }

  async getGoodsReceiptDetail(
    goodsReceiptId: string,
    user: RequestUser,
    tx?: Parameters<PurchasingRepository['getGoodsReceiptById']>[1],
  ) {
    const receipt = await this.purchasingRepository.getGoodsReceiptById(
      goodsReceiptId,
      tx,
    );

    if (!receipt) {
      throw new NotFoundException('La recepcion no existe.');
    }

    await this.businessAccessService.assertBusinessMembership(
      user.id,
      receipt.businessId,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      receipt.businessId,
      receipt.branchId,
    );

    const items = await this.purchasingRepository.getGoodsReceiptItems(
      goodsReceiptId,
      tx,
    );

    return this.buildGoodsReceiptDetailResponse(receipt, items);
  }

  async createGoodsReceipt(input: CreateGoodsReceiptDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      input.business_id,
      input.branch_id,
    );

    const uniqueProductIds = [
      ...new Set(input.items.map((item) => item.product_id)),
    ];

    if (uniqueProductIds.length !== input.items.length) {
      throw new BadRequestException(
        'No repitas el mismo producto dentro de la recepcion.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const order =
        await this.purchasingRepository.getPurchaseOrderByIdForUpdate(
          input.purchase_order_id,
          tx,
        );

      if (!order) {
        throw new NotFoundException('La orden de compra no existe.');
      }

      await this.assertPurchaseOrderAccess(order, user);

      if (order.status === PurchaseOrderStatus.CANCELLED) {
        throw new BadRequestException(
          'No puedes recibir mercancia de una orden cancelada.',
        );
      }

      const orderItems = await this.purchasingRepository.getPurchaseOrderItems(
        input.purchase_order_id,
        tx,
      );
      const receivedTotals =
        await this.purchasingRepository.getPurchaseOrderReceivedTotalsByProductIds(
          input.purchase_order_id,
          tx,
        );

      const receivedByProduct = new Map<string, number>(
        receivedTotals.map((row) => [row.productId, row.receivedQuantity]),
      );
      const orderItemsByProduct = new Map(
        orderItems.map((item) => [item.productId, item]),
      );
      const orderItemsById = new Map(orderItems.map((item) => [item.id, item]));

      const receiptItems = input.items.map((item) => {
        const orderItem = item.purchase_order_item_id
          ? orderItemsById.get(item.purchase_order_item_id)
          : orderItemsByProduct.get(item.product_id);

        if (!orderItem) {
          throw new NotFoundException(
            'Uno de los productos no pertenece a la orden.',
          );
        }

        if (
          item.purchase_order_item_id &&
          orderItem.id !== item.purchase_order_item_id
        ) {
          throw new BadRequestException(
            'La linea de recepcion no coincide con la orden.',
          );
        }

        if (orderItem.productId !== item.product_id) {
          throw new BadRequestException(
            'El producto de la recepcion no coincide con la orden.',
          );
        }

        const quantity = roundQuantity(item.quantity);
        const receivedQuantity = roundQuantity(
          receivedByProduct.get(orderItem.productId) ?? 0,
        );
        const pendingQuantity = roundQuantity(
          Math.max(orderItem.quantity - receivedQuantity, 0),
        );

        if (quantity <= 0) {
          throw new BadRequestException(
            'La cantidad recibida debe ser mayor a cero.',
          );
        }

        if (quantity > pendingQuantity + QUANTITY_EPSILON) {
          throw new BadRequestException(
            'La cantidad recibida excede lo pendiente.',
          );
        }

        const unitCost = roundCurrency(item.unit_cost ?? orderItem.unitCost);

        return {
          orderItem,
          quantity,
          unitCost,
          lineTotal: roundCurrency(quantity * unitCost),
        };
      });

      const receiptLocation = input.location_id
        ? await this.purchasingRepository.getInventoryLocationById(
            input.business_id,
            input.branch_id,
            input.location_id,
            tx,
          )
        : await this.stockService.getDefaultInventoryLocationByBranch(
            input.business_id,
            input.branch_id,
            tx,
          );

      if (!receiptLocation) {
        throw new NotFoundException(
          'La ubicacion seleccionada no pertenece a la sucursal.',
        );
      }

      const receipt = await this.purchasingRepository.createGoodsReceiptHeader(
        {
          businessId: input.business_id,
          branchId: input.branch_id,
          locationId: receiptLocation.id,
          purchaseOrderId: input.purchase_order_id,
          supplierId: order.supplierId,
          receivedBy: user.id,
          notes: input.notes?.trim() || null,
        },
        tx,
      );

      const receiptLocationId = receiptLocation.id;

      for (const item of receiptItems) {
        const stockBalance =
          await this.purchasingRepository.getStockBalanceForUpdate(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: receiptLocationId,
              productId: item.orderItem.productId,
            },
            tx,
          );

        if (stockBalance) {
          await this.purchasingRepository.updateStockBalance(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: receiptLocationId,
              productId: item.orderItem.productId,
              quantityDelta: item.quantity,
            },
            tx,
          );
        } else {
          await this.purchasingRepository.insertStockBalance(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: receiptLocationId,
              productId: item.orderItem.productId,
              quantity: item.quantity,
            },
            tx,
          );
        }

        await this.purchasingRepository.createGoodsReceiptItem(
          {
            goodsReceiptId: receipt.id,
            productId: item.orderItem.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          },
          tx,
        );

        await this.purchasingRepository.createInventoryMovement(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: receiptLocationId,
            productId: item.orderItem.productId,
            movementType: InventoryMovementType.PURCHASE_IN,
            quantity: item.quantity,
            referenceType: 'goods_receipt',
            referenceId: receipt.id,
            unitCost: item.unitCost,
            notes: input.notes?.trim() || 'Recepcion de mercancia',
            actorUserId: user.id,
          },
          tx,
        );
      }

      const summary =
        await this.purchasingRepository.getPurchaseOrderSummaryByIds(
          [input.purchase_order_id],
          tx,
        );
      const orderSummary = summary[0];

      await this.purchasingRepository.updatePurchaseOrderStatus(
        input.purchase_order_id,
        (orderSummary?.pendingQuantity ?? 0) <= QUANTITY_EPSILON
          ? PurchaseOrderStatus.RECEIVED
          : PurchaseOrderStatus.PARTIALLY_RECEIVED,
        tx,
      );

      const response = await this.getGoodsReceiptDetail(receipt.id, user, tx);

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'create_goods_receipt',
        entityType: 'goods_receipt',
        entityId: receipt.id,
        afterJson: response,
        tx,
      });

      return response;
    });
  }
}
