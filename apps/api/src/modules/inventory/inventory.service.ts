import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  INVENTORY_MUTATION_ROLES,
  INVENTORY_READ_ROLES,
} from '../../common/authz/role-groups';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import { StockAlertStatus } from '../../common/enums/stock-alert-status.enum';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { StockService } from '../shared-db/stock.service';
import type { CreateLocationDto } from './dto/create-location.dto';
import type { CreateBrandDto } from './dto/create-brand.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { CreateInventoryEntryDto } from './dto/create-inventory-entry.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { CreateSupplierDto } from './dto/create-supplier.dto';
import type { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import type { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import type { CreateTransferDto } from './dto/create-transfer.dto';
import type { DeactivateProductDto } from './dto/deactivate-product.dto';
import type { GetDefaultLocationDto } from './dto/get-default-location.dto';
import type { GetInventoryCatalogsDto } from './dto/get-inventory-catalogs.dto';
import type { ListInventoryAlertsDto } from './dto/list-inventory-alerts.dto';
import type { ListInventoryMovementsDto } from './dto/list-inventory-movements.dto';
import type { ListLocationsDto } from './dto/list-locations.dto';
import type { GetProductDetailDto } from './dto/get-product-detail.dto';
import type { GetProductMovementsDto } from './dto/get-product-movements.dto';
import type { GetProductStockDto } from './dto/get-product-stock.dto';
import type { ListProductsDto } from './dto/list-products.dto';
import type { ReactivateProductDto } from './dto/reactivate-product.dto';
import type { SearchProductsDto } from './dto/search-products.dto';
import type { SetAlertStatusDto } from './dto/set-alert-status.dto';
import type { SetLocationActiveDto } from './dto/set-location-active.dto';
import type { UpdateLocationDto } from './dto/update-location.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { InventoryRepository } from './inventory.repository';

type LowStockAlertMetadata = {
  availableStock?: number;
  minStock?: number;
  clearedAt?: string;
  resolvedAt?: string;
  dismissedAt?: string;
  reopenedAt?: string;
};

@Injectable()
export class InventoryService {
  constructor(
    private readonly auditService: AuditService,
    private readonly businessAccessService: BusinessAccessService,
    private readonly inventoryRepository: InventoryRepository,
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  private isDuplicateKeyError(error: unknown) {
    return error instanceof Error && /duplicate key value/i.test(error.message);
  }

  private assertInventoryReadAccess(
    user: RequestUser,
    businessId: string,
    branchId?: string | null,
  ) {
    return this.businessAccessService.assertBusinessRole(
      user.id,
      businessId,
      INVENTORY_READ_ROLES,
      branchId,
      'No tienes permiso para consultar inventario.',
    );
  }

  private assertInventoryWriteAccess(
    user: RequestUser,
    businessId: string,
    branchId?: string | null,
  ) {
    return this.businessAccessService.assertBusinessRole(
      user.id,
      businessId,
      INVENTORY_MUTATION_ROLES,
      branchId,
      'No tienes permiso para modificar inventario.',
    );
  }

  private normalizeBarcodes(
    primaryBarcode?: string,
    additionalBarcodes?: string[],
  ) {
    const cleanedPrimary = primaryBarcode?.trim() || null;
    const cleanedAdditional = (additionalBarcodes ?? [])
      .map((barcode) => barcode.trim())
      .filter((barcode) => barcode.length > 0);

    const allBarcodes = Array.from(
      new Set([cleanedPrimary, ...cleanedAdditional].filter(Boolean)),
    ) as string[];

    if (allBarcodes.length === 0) {
      return {
        primaryBarcode: null,
        additionalBarcodes: [] as string[],
      };
    }

    return {
      primaryBarcode: allBarcodes[0]!,
      additionalBarcodes: allBarcodes.slice(1),
    };
  }

  private async syncProductAssets(
    productId: string,
    input: {
      primaryBarcode?: string | null;
      additionalBarcodes?: string[];
      primaryImageUrl?: string | null;
    },
    tx: PrismaExecutor,
  ) {
    const normalized = this.normalizeBarcodes(
      input.primaryBarcode ?? undefined,
      input.additionalBarcodes,
    );

    await this.inventoryRepository.deleteProductBarcodes(productId, tx);

    if (normalized.primaryBarcode) {
      await this.inventoryRepository.createProductBarcode(
        {
          productId,
          barcode: normalized.primaryBarcode,
          isPrimary: true,
        },
        tx,
      );
    }

    for (const barcode of normalized.additionalBarcodes) {
      await this.inventoryRepository.createProductBarcode(
        {
          productId,
          barcode,
          isPrimary: false,
        },
        tx,
      );
    }

    await this.inventoryRepository.deleteProductImages(productId, tx);

    if (input.primaryImageUrl?.trim()) {
      await this.inventoryRepository.createProductImage(
        {
          productId,
          imageUrl: input.primaryImageUrl.trim(),
          isPrimary: true,
        },
        tx,
      );
    }

    return normalized;
  }

  private async assertOptionalCatalogReferences(
    businessId: string,
    input: {
      categoryId?: string;
      brandId?: string;
      taxRateId?: string;
    },
  ) {
    if (input.categoryId) {
      const category = await this.inventoryRepository.getCategoryById(
        businessId,
        input.categoryId,
      );

      if (!category) {
        throw new NotFoundException(
          'La categoria seleccionada no esta disponible.',
        );
      }
    }

    if (input.brandId) {
      const brand = await this.inventoryRepository.getBrandById(
        businessId,
        input.brandId,
      );

      if (!brand) {
        throw new NotFoundException(
          'La marca seleccionada no esta disponible.',
        );
      }
    }

    if (input.taxRateId) {
      const taxRate = await this.inventoryRepository.getTaxRateById(
        businessId,
        input.taxRateId,
      );

      if (!taxRate) {
        throw new NotFoundException('La tasa seleccionada no esta disponible.');
      }
    }
  }

  private buildLocationResponse(
    location: Awaited<
      ReturnType<InventoryRepository['getLocationById']>
    > extends infer T
      ? NonNullable<T>
      : never,
  ) {
    return {
      id: location.id,
      businessId: location.businessId,
      branchId: location.branchId,
      name: location.name,
      code: location.code,
      isDefault: location.isDefault,
      isActive: location.isActive,
      createdAt: location.createdAt ?? null,
      updatedAt: location.updatedAt ?? null,
      totalQuantity: location.totalQuantity ?? 0,
      reservedQuantity: location.reservedQuantity ?? 0,
      availableQuantity: location.availableQuantity ?? 0,
      productsCount: location.productsCount ?? 0,
    };
  }

  private buildInventoryAlertResponse(
    alert: Awaited<
      ReturnType<InventoryRepository['getInventoryAlertById']>
    > extends infer T
      ? NonNullable<T>
      : never,
  ) {
    const metadata: Record<string, unknown> =
      alert.metadata && typeof alert.metadata === 'object'
        ? (alert.metadata as Record<string, unknown>)
        : {};
    const availableStock =
      typeof (metadata as { availableStock?: unknown }).availableStock ===
      'number'
        ? Number((metadata as { availableStock: number }).availableStock)
        : null;
    const locationId =
      typeof (metadata as { locationId?: unknown }).locationId === 'string'
        ? String((metadata as { locationId: string }).locationId)
        : null;
    const locationName =
      typeof (metadata as { locationName?: unknown }).locationName === 'string'
        ? String((metadata as { locationName: string }).locationName)
        : null;
    const minStock =
      typeof (metadata as { minStock?: unknown }).minStock === 'number'
        ? Number((metadata as { minStock: number }).minStock)
        : (alert.minStock ?? null);

    return {
      id: alert.id,
      businessId: alert.businessId,
      branchId: alert.branchId,
      productId: alert.productId,
      productName: alert.productName ?? null,
      productSku: alert.productSku ?? null,
      alertType: alert.alertType,
      title: alert.title,
      message: alert.message,
      status: alert.status,
      locationId,
      locationName,
      minStock,
      currentStock: availableStock,
      metadata,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
  }

  private getLowStockAlertContent(input: {
    productName: string;
    availableStock: number;
    minStock: number;
  }) {
    return {
      title: `Stock bajo: ${input.productName}`,
      message: `Disponible ${input.availableStock} de minimo ${input.minStock}.`,
    };
  }

  private buildMovementReferenceLabel(input: {
    referenceType: string | null;
    referenceId: string | null;
  }) {
    if (!input.referenceType || !input.referenceId) {
      return null;
    }

    const suffix = input.referenceId.replace(/-/g, '').slice(-6).toUpperCase();

    switch (input.referenceType) {
      case 'goods_receipt':
        return `REC-${suffix}`;
      case 'sale':
        return `VTA-${suffix}`;
      case 'sale_cancel':
        return `CAN-${suffix}`;
      case 'refund':
        return `DEV-${suffix}`;
      case 'stock_adjustment':
        return `AJU-${suffix}`;
      case 'transfer':
      case 'inventory_transfer':
        return `TRF-${suffix}`;
      case 'product_create':
        return `ALT-${suffix}`;
      default:
        return suffix;
    }
  }

  private buildMovementResponse(
    movement: Awaited<
      ReturnType<InventoryRepository['listProductMovements']>
    > extends infer T
      ? T extends Array<infer Item>
        ? Item
        : never
      : never,
  ) {
    return {
      id: movement.id,
      productId: movement.productId,
      productName: movement.productName,
      productSku: movement.sku,
      movementType: movement.movementType,
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      notes: movement.notes,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      referenceLabel: this.buildMovementReferenceLabel(movement),
      locationId: movement.locationId,
      locationName: movement.locationName,
      locationCode: movement.locationCode ?? null,
      createdBy: movement.createdBy,
      createdByName: movement.createdByName,
      createdAt: movement.createdAt,
    };
  }

  private async syncLowStockAlerts(
    businessId: string,
    branchId: string,
    tx: PrismaExecutor,
  ) {
    const candidates = await this.inventoryRepository.listLowStockCandidates(
      businessId,
      branchId,
      tx,
    );
    const candidateProductIds = new Set(
      candidates.map((candidate) => candidate.productId),
    );
    const alertsByProductId = new Map(
      (
        await this.inventoryRepository.listLatestLowStockAlerts(
          businessId,
          branchId,
          tx,
        )
      ).map((alert) => [alert.productId ?? '', alert]),
    );

    const nowIso = new Date().toISOString();

    for (const candidate of candidates) {
      const isLow = candidate.availableStock <= candidate.minStock;
      const currentAlert = alertsByProductId.get(candidate.productId);
      const currentMetadata: LowStockAlertMetadata =
        currentAlert?.metadata && typeof currentAlert.metadata === 'object'
          ? (currentAlert.metadata as LowStockAlertMetadata)
          : {};
      const currentAlertStatus = currentAlert?.status as
        | StockAlertStatus
        | undefined;

      if (isLow) {
        const content = this.getLowStockAlertContent({
          productName: candidate.productName,
          availableStock: candidate.availableStock,
          minStock: candidate.minStock,
        });

        const nextMetadata: LowStockAlertMetadata = {
          ...currentMetadata,
          availableStock: candidate.availableStock,
          minStock: candidate.minStock,
        };

        if (!currentAlert) {
          await this.inventoryRepository.createInventoryAlert(
            {
              businessId,
              branchId,
              productId: candidate.productId,
              alertType: 'low_stock',
              title: content.title,
              message: content.message,
              status: StockAlertStatus.ACTIVE,
              metadata: nextMetadata,
            },
            tx,
          );
          continue;
        }

        if (currentAlertStatus === StockAlertStatus.ACTIVE) {
          await this.inventoryRepository.updateInventoryAlert(
            {
              alertId: currentAlert.id,
              businessId,
              branchId,
              title: content.title,
              message: content.message,
              metadata: nextMetadata,
            },
            tx,
          );
          continue;
        }

        if (currentMetadata.clearedAt) {
          await this.inventoryRepository.updateInventoryAlert(
            {
              alertId: currentAlert.id,
              businessId,
              branchId,
              title: content.title,
              message: content.message,
              status: StockAlertStatus.ACTIVE,
              metadata: {
                ...nextMetadata,
                clearedAt: undefined,
                reopenedAt: nowIso,
              },
            },
            tx,
          );
        }

        continue;
      }

      if (!currentAlert) {
        continue;
      }

      const nextMetadata: LowStockAlertMetadata = {
        ...currentMetadata,
        availableStock: candidate.availableStock,
        minStock: candidate.minStock,
        clearedAt: currentMetadata.clearedAt ?? nowIso,
      };

      await this.inventoryRepository.updateInventoryAlert(
        {
          alertId: currentAlert.id,
          businessId,
          branchId,
          status:
            currentAlertStatus === StockAlertStatus.ACTIVE
              ? StockAlertStatus.RESOLVED
              : undefined,
          metadata: nextMetadata,
        },
        tx,
      );
    }

    for (const [productId, alert] of alertsByProductId.entries()) {
      if (!productId || candidateProductIds.has(productId)) {
        continue;
      }

      const currentMetadata: LowStockAlertMetadata =
        alert.metadata && typeof alert.metadata === 'object'
          ? (alert.metadata as LowStockAlertMetadata)
          : {};
      const alertStatus = alert.status as StockAlertStatus;

      await this.inventoryRepository.updateInventoryAlert(
        {
          alertId: alert.id,
          businessId,
          branchId,
          status:
            alertStatus === StockAlertStatus.ACTIVE
              ? StockAlertStatus.RESOLVED
              : undefined,
          metadata: {
            ...currentMetadata,
            clearedAt: currentMetadata.clearedAt ?? nowIso,
          },
        },
        tx,
      );
    }
  }

  async searchProducts(query: SearchProductsDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    return this.inventoryRepository.searchProducts(
      query.business_id,
      query.branch_id,
      query.query ?? '',
    );
  }

  async listProducts(query: ListProductsDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    return this.inventoryRepository.listProducts(
      query.business_id,
      query.branch_id,
      {
        query: query.query,
        includeInactive: query.include_inactive ?? false,
        limit: query.limit ?? 100,
      },
    );
  }

  async createProduct(input: CreateProductDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      input.business_id,
      input.branch_id,
    );
    await this.assertInventoryWriteAccess(
      user,
      input.business_id,
      input.branch_id,
    );

    if (!input.track_inventory && (input.initial_stock ?? 0) > 0) {
      throw new BadRequestException(
        'No puedes asignar stock inicial a un articulo sin control de inventario.',
      );
    }

    await this.assertOptionalCatalogReferences(input.business_id, {
      categoryId: input.category_id,
      brandId: input.brand_id,
      taxRateId: input.tax_rate_id,
    });

    if (input.location_id) {
      const locationBelongsToBranch =
        await this.inventoryRepository.assertLocationBelongsToBranch(
          input.business_id,
          input.branch_id,
          input.location_id,
        );

      if (!locationBelongsToBranch) {
        throw new NotFoundException(
          'La ubicacion seleccionada no pertenece a la sucursal.',
        );
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await this.inventoryRepository.createProduct(
          {
            businessId: input.business_id,
            categoryId: input.category_id ?? null,
            brandId: input.brand_id ?? null,
            taxRateId: input.tax_rate_id ?? null,
            sku: input.sku.trim(),
            name: input.name.trim(),
            description: input.description?.trim() || null,
            costPrice: input.cost_price,
            salePrice: input.sale_price,
            minStock: input.min_stock,
            trackInventory: input.track_inventory,
            createdBy: user.id,
          },
          tx,
        );

        const normalizedBarcodes = await this.syncProductAssets(
          product.id,
          {
            primaryBarcode: input.barcode ?? null,
            additionalBarcodes: input.additional_barcodes,
            primaryImageUrl: input.primary_image_url ?? null,
          },
          tx,
        );

        const initialStock = input.initial_stock ?? 0;
        let stockLocation =
          input.location_id && input.track_inventory && initialStock > 0
            ? {
                id: input.location_id,
              }
            : null;

        if (input.track_inventory && initialStock > 0) {
          if (!stockLocation) {
            stockLocation =
              await this.stockService.getDefaultInventoryLocationByBranch(
                input.business_id,
                input.branch_id,
                tx,
              );
          }

          await this.inventoryRepository.insertStockBalance(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: stockLocation.id,
              productId: product.id,
              quantity: initialStock,
            },
            tx,
          );

          await this.inventoryRepository.createInventoryMovement(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: stockLocation.id,
              productId: product.id,
              movementType: InventoryMovementType.ADJUSTMENT_IN,
              quantity: initialStock,
              referenceType: 'product_create',
              referenceId: product.id,
              unitCost: input.cost_price,
              notes: 'Stock inicial de alta de articulo',
              actorUserId: user.id,
            },
            tx,
          );
        }

        await this.syncLowStockAlerts(input.business_id, input.branch_id, tx);

        const response = {
          product_id: product.id,
          business_id: product.businessId,
          name: product.name,
          sku: product.sku,
          sale_price: product.salePrice,
          cost_price: product.costPrice,
          track_inventory: product.trackInventory,
          initial_stock: initialStock,
          location_id: stockLocation?.id ?? null,
          primary_barcode: normalizedBarcodes.primaryBarcode,
          additional_barcodes: normalizedBarcodes.additionalBarcodes,
          primary_image_url: input.primary_image_url?.trim() || null,
          created_at: product.createdAt,
        };

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'create_product',
          entityType: 'product',
          entityId: product.id,
          afterJson: response,
          tx,
        });

        return response;
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'El SKU o codigo de barras ya existe para este negocio.',
        );
      }

      throw error;
    }
  }

  async getProductDetail(
    productId: string,
    query: GetProductDetailDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    const product = await this.inventoryRepository.getProductDetail(
      query.business_id,
      query.branch_id,
      productId,
    );

    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    const barcodes =
      await this.inventoryRepository.listProductBarcodes(productId);
    const primaryBarcode = barcodes.find(
      (barcode) => barcode.isPrimary,
    )?.barcode;

    return {
      ...product,
      primaryBarcode: primaryBarcode ?? null,
      additionalBarcodes: barcodes
        .filter((barcode) => !barcode.isPrimary)
        .map((barcode) => barcode.barcode),
    };
  }

  async updateProduct(
    productId: string,
    input: UpdateProductDto,
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
    await this.assertInventoryWriteAccess(
      user,
      input.business_id,
      input.branch_id,
    );

    await this.assertOptionalCatalogReferences(input.business_id, {
      categoryId: input.category_id,
      brandId: input.brand_id,
      taxRateId: input.tax_rate_id,
    });

    const currentProduct = await this.inventoryRepository.getProductById(
      input.business_id,
      productId,
    );

    if (!currentProduct) {
      throw new NotFoundException('Producto no encontrado.');
    }

    if (!input.track_inventory && currentProduct.trackInventory) {
      const availableStock = await this.stockService.getAvailableStock(
        input.business_id,
        input.branch_id,
        productId,
      );

      if (availableStock > 0) {
        throw new BadRequestException(
          'No puedes quitar el control de inventario mientras el articulo tiene stock.',
        );
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updatedProduct = await this.inventoryRepository.updateProduct(
          {
            productId,
            businessId: input.business_id,
            categoryId: input.category_id ?? null,
            brandId: input.brand_id ?? null,
            taxRateId: input.tax_rate_id ?? null,
            sku: input.sku.trim(),
            name: input.name.trim(),
            description: input.description?.trim() || null,
            costPrice: input.cost_price,
            salePrice: input.sale_price,
            minStock: input.min_stock,
            trackInventory: input.track_inventory,
          },
          tx,
        );

        if (!updatedProduct) {
          throw new NotFoundException('Producto no encontrado.');
        }

        await this.syncProductAssets(
          productId,
          {
            primaryBarcode: input.barcode ?? null,
            additionalBarcodes: input.additional_barcodes,
            primaryImageUrl: input.primary_image_url ?? null,
          },
          tx,
        );

        const detail = await this.inventoryRepository.getProductDetail(
          input.business_id,
          input.branch_id,
          productId,
          tx,
        );

        const barcodes = await this.inventoryRepository.listProductBarcodes(
          productId,
          tx,
        );

        const response = {
          ...detail,
          primaryBarcode:
            barcodes.find((barcode) => barcode.isPrimary)?.barcode ?? null,
          additionalBarcodes: barcodes
            .filter((barcode) => !barcode.isPrimary)
            .map((barcode) => barcode.barcode),
        };

        await this.syncLowStockAlerts(input.business_id, input.branch_id, tx);

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'update_product',
          entityType: 'product',
          entityId: productId,
          beforeJson: currentProduct,
          afterJson: response,
          tx,
        });

        return response;
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'El SKU o codigo de barras ya existe para este negocio.',
        );
      }

      throw error;
    }
  }

  async deactivateProduct(
    productId: string,
    input: DeactivateProductDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.assertInventoryWriteAccess(user, input.business_id);

    return this.prisma.$transaction(async (tx) => {
      const currentProduct = await this.inventoryRepository.getProductById(
        input.business_id,
        productId,
        tx,
      );

      if (!currentProduct) {
        throw new NotFoundException('Producto no encontrado.');
      }

      const deactivatedProduct =
        await this.inventoryRepository.deactivateProduct(
          input.business_id,
          productId,
          tx,
        );

      if (!deactivatedProduct) {
        throw new NotFoundException('Producto no encontrado.');
      }

      const result = {
        product_id: deactivatedProduct.id,
        name: deactivatedProduct.name,
        is_active: deactivatedProduct.isActive,
      };

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'deactivate_product',
        entityType: 'product',
        entityId: deactivatedProduct.id,
        beforeJson: currentProduct,
        afterJson: result,
        tx,
      });

      return result;
    });
  }

  async reactivateProduct(
    productId: string,
    input: ReactivateProductDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.assertInventoryWriteAccess(user, input.business_id);

    return this.prisma.$transaction(async (tx) => {
      const currentProduct = await this.inventoryRepository.getProductById(
        input.business_id,
        productId,
        tx,
      );

      if (!currentProduct) {
        throw new NotFoundException('Producto no encontrado.');
      }

      const reactivatedProduct =
        await this.inventoryRepository.reactivateProduct(
          input.business_id,
          productId,
          tx,
        );

      if (!reactivatedProduct) {
        throw new NotFoundException('Producto no encontrado.');
      }

      const result = {
        product_id: reactivatedProduct.id,
        name: reactivatedProduct.name,
        is_active: reactivatedProduct.isActive,
      };

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'reactivate_product',
        entityType: 'product',
        entityId: reactivatedProduct.id,
        beforeJson: currentProduct,
        afterJson: result,
        tx,
      });

      return result;
    });
  }

  async getProductStock(
    productId: string,
    query: GetProductStockDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    const product = await this.inventoryRepository.getProductById(
      query.business_id,
      productId,
    );

    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    const locationBalances =
      await this.inventoryRepository.listProductStockByLocation(
        query.business_id,
        query.branch_id,
        productId,
      );

    const totalQuantity = locationBalances.reduce(
      (sum, balance) => sum + balance.quantity,
      0,
    );
    const totalReservedQuantity = locationBalances.reduce(
      (sum, balance) => sum + balance.reservedQuantity,
      0,
    );
    const totalAvailableQuantity = locationBalances.reduce(
      (sum, balance) => sum + balance.availableQuantity,
      0,
    );
    const selectedLocation = query.location_id
      ? (locationBalances.find(
          (balance) => balance.locationId === query.location_id,
        ) ?? null)
      : null;

    if (query.location_id && !selectedLocation) {
      throw new NotFoundException(
        'La ubicacion seleccionada no pertenece a la sucursal.',
      );
    }

    const defaultLocation =
      locationBalances.find((balance) => balance.isDefault) ?? null;

    return {
      product_id: product.id,
      product_name: product.name,
      track_inventory: product.trackInventory,
      quantity: selectedLocation
        ? selectedLocation.availableQuantity
        : totalAvailableQuantity,
      reserved_quantity: selectedLocation
        ? selectedLocation.reservedQuantity
        : totalReservedQuantity,
      available_quantity: selectedLocation
        ? selectedLocation.availableQuantity
        : totalAvailableQuantity,
      location_id: query.location_id ?? null,
      total_quantity: totalQuantity,
      total_reserved_quantity: totalReservedQuantity,
      total_available_quantity: totalAvailableQuantity,
      default_location_id: defaultLocation?.locationId ?? null,
      default_location_name: defaultLocation?.locationName ?? null,
      locations: locationBalances.map((balance) => ({
        location_id: balance.locationId,
        location_name: balance.locationName,
        location_code: balance.locationCode,
        is_default: balance.isDefault,
        is_active: balance.isActive,
        quantity: balance.quantity,
        reserved_quantity: balance.reservedQuantity,
        available_quantity: balance.availableQuantity,
      })),
    };
  }

  async listInventoryMovements(
    query: ListInventoryMovementsDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    const movements = await this.inventoryRepository.listInventoryMovements(
      query.business_id,
      query.branch_id,
      {
        productId: query.product_id,
        locationId: query.location_id,
        movementType: query.movement_type,
        limit: query.limit,
      },
    );

    return movements.map((movement) => this.buildMovementResponse(movement));
  }

  async getProductMovements(
    productId: string,
    query: GetProductMovementsDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    const product = await this.inventoryRepository.getProductById(
      query.business_id,
      productId,
    );

    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    const movements = await this.inventoryRepository.listProductMovements(
      query.business_id,
      query.branch_id,
      productId,
      query.limit ?? 20,
    );

    return movements.map((movement) => this.buildMovementResponse(movement));
  }

  async getDefaultLocation(query: GetDefaultLocationDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    return this.stockService.getDefaultInventoryLocationByBranch(
      query.business_id,
      query.branch_id,
    );
  }

  async listLocations(query: ListLocationsDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    const locations = await this.inventoryRepository.listLocationsForManagement(
      query.business_id,
      query.branch_id,
      {
        includeInactive: query.include_inactive ?? true,
      },
    );

    return locations.map((location) => this.buildLocationResponse(location));
  }

  async createLocation(input: CreateLocationDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      input.business_id,
      input.branch_id,
    );
    await this.assertInventoryWriteAccess(
      user,
      input.business_id,
      input.branch_id,
    );

    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();

    if (!name) {
      throw new BadRequestException(
        'El nombre de la ubicacion es obligatorio.',
      );
    }

    if (!code) {
      throw new BadRequestException(
        'El codigo de la ubicacion es obligatorio.',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const activeLocations =
          await this.inventoryRepository.countActiveLocations(
            input.business_id,
            input.branch_id,
            tx,
          );
        const shouldBeDefault = input.is_default ?? activeLocations === 0;

        if (shouldBeDefault) {
          await this.inventoryRepository.clearDefaultLocation(
            input.business_id,
            input.branch_id,
            tx,
          );
        }

        const location = await this.inventoryRepository.createLocation(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            name,
            code,
            isDefault: shouldBeDefault,
          },
          tx,
        );

        const response = this.buildLocationResponse(location);

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'create_inventory_location',
          entityType: 'inventory_location',
          entityId: location.id,
          afterJson: response,
          tx,
        });

        return response;
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Ya existe una ubicacion con ese codigo en la sucursal.',
        );
      }

      throw error;
    }
  }

  async updateLocation(
    locationId: string,
    input: UpdateLocationDto,
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
    await this.assertInventoryWriteAccess(
      user,
      input.business_id,
      input.branch_id,
    );

    const currentLocation = await this.inventoryRepository.getLocationById(
      input.business_id,
      input.branch_id,
      locationId,
    );

    if (!currentLocation) {
      throw new NotFoundException('Ubicacion no encontrada.');
    }

    if (currentLocation.isDefault && input.is_default === false) {
      throw new BadRequestException(
        'Selecciona otra ubicacion como default antes de quitar esta como predeterminada.',
      );
    }

    if (!currentLocation.isActive && input.is_default) {
      throw new BadRequestException(
        'No puedes marcar como default una ubicacion inactiva.',
      );
    }

    const nextName = input.name?.trim();
    const nextCode = input.code?.trim().toUpperCase();

    if (nextName !== undefined && !nextName) {
      throw new BadRequestException(
        'El nombre de la ubicacion es obligatorio.',
      );
    }

    if (nextCode !== undefined && !nextCode) {
      throw new BadRequestException(
        'El codigo de la ubicacion es obligatorio.',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (input.is_default) {
          await this.inventoryRepository.clearDefaultLocation(
            input.business_id,
            input.branch_id,
            tx,
            locationId,
          );
        }

        const updatedLocation = await this.inventoryRepository.updateLocation(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId,
            name: nextName,
            code: nextCode,
            isDefault: input.is_default,
          },
          tx,
        );

        if (!updatedLocation) {
          throw new NotFoundException('Ubicacion no encontrada.');
        }

        const stockSummary =
          await this.inventoryRepository.getLocationBalanceSummary(
            input.business_id,
            input.branch_id,
            locationId,
            tx,
          );

        const response = this.buildLocationResponse({
          ...updatedLocation,
          ...stockSummary,
        });

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'update_inventory_location',
          entityType: 'inventory_location',
          entityId: locationId,
          beforeJson: currentLocation,
          afterJson: response,
          tx,
        });

        return response;
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Ya existe una ubicacion con ese codigo en la sucursal.',
        );
      }

      throw error;
    }
  }

  async setLocationActive(
    locationId: string,
    input: SetLocationActiveDto,
    user: RequestUser,
    isActive: boolean,
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
    await this.assertInventoryWriteAccess(
      user,
      input.business_id,
      input.branch_id,
    );

    const currentLocation = await this.inventoryRepository.getLocationById(
      input.business_id,
      input.branch_id,
      locationId,
    );

    if (!currentLocation) {
      throw new NotFoundException('Ubicacion no encontrada.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (!isActive) {
        const activeLocations =
          await this.inventoryRepository.countActiveLocations(
            input.business_id,
            input.branch_id,
            tx,
          );

        if (activeLocations <= 1 && currentLocation.isActive) {
          throw new BadRequestException(
            'Debe permanecer al menos una ubicacion activa en la sucursal.',
          );
        }

        const stockSummary =
          await this.inventoryRepository.getLocationBalanceSummary(
            input.business_id,
            input.branch_id,
            locationId,
            tx,
          );

        if (
          stockSummary.totalQuantity > 0 ||
          stockSummary.reservedQuantity > 0
        ) {
          throw new BadRequestException(
            'No puedes desactivar una ubicacion que todavia tiene stock.',
          );
        }
      }

      const updatedLocation = await this.inventoryRepository.setLocationActive(
        input.business_id,
        input.branch_id,
        locationId,
        isActive,
        tx,
      );

      if (!updatedLocation) {
        throw new NotFoundException('Ubicacion no encontrada.');
      }

      if (!isActive && currentLocation.isDefault) {
        const nextDefault =
          await this.inventoryRepository.getNextActiveLocation(
            input.business_id,
            input.branch_id,
            locationId,
            tx,
          );

        if (nextDefault) {
          await this.inventoryRepository.clearDefaultLocation(
            input.business_id,
            input.branch_id,
            tx,
            nextDefault.id,
          );
          await this.inventoryRepository.updateLocation(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: nextDefault.id,
              isDefault: true,
            },
            tx,
          );
          updatedLocation.isDefault = false;
        }
      }

      if (isActive) {
        const activeLocations =
          await this.inventoryRepository.listLocationsForManagement(
            input.business_id,
            input.branch_id,
            {
              includeInactive: false,
            },
            tx,
          );
        const hasDefault = activeLocations.some(
          (location) => location.isDefault,
        );

        if (!hasDefault) {
          await this.inventoryRepository.clearDefaultLocation(
            input.business_id,
            input.branch_id,
            tx,
            locationId,
          );
          await this.inventoryRepository.updateLocation(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId,
              isDefault: true,
            },
            tx,
          );
          updatedLocation.isDefault = true;
        }
      }

      const response = this.buildLocationResponse(updatedLocation);

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: isActive
          ? 'reactivate_inventory_location'
          : 'deactivate_inventory_location',
        entityType: 'inventory_location',
        entityId: locationId,
        beforeJson: currentLocation,
        afterJson: response,
        tx,
      });

      return response;
    });
  }

  async createTransfer(input: CreateTransferDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      input.business_id,
      input.branch_id,
    );
    await this.assertInventoryWriteAccess(
      user,
      input.business_id,
      input.branch_id,
    );

    if (input.from_location_id === input.to_location_id) {
      throw new BadRequestException(
        'Selecciona ubicaciones distintas para transferir stock.',
      );
    }

    if (input.quantity <= 0) {
      throw new BadRequestException(
        'La cantidad a transferir debe ser mayor a cero.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const [product, fromLocation, toLocation] = await Promise.all([
        this.inventoryRepository.getProductById(
          input.business_id,
          input.product_id,
          tx,
        ),
        this.inventoryRepository.getLocationById(
          input.business_id,
          input.branch_id,
          input.from_location_id,
          tx,
        ),
        this.inventoryRepository.getLocationById(
          input.business_id,
          input.branch_id,
          input.to_location_id,
          tx,
        ),
      ]);

      if (!product) {
        throw new NotFoundException('Producto no encontrado.');
      }

      if (!product.trackInventory) {
        throw new BadRequestException(
          'El articulo seleccionado no controla inventario.',
        );
      }

      if (!fromLocation || !fromLocation.isActive) {
        throw new NotFoundException(
          'La ubicacion origen no esta disponible en la sucursal.',
        );
      }

      if (!toLocation || !toLocation.isActive) {
        throw new NotFoundException(
          'La ubicacion destino no esta disponible en la sucursal.',
        );
      }

      const fromBalance = await this.inventoryRepository.lockStockBalance(
        input.business_id,
        input.branch_id,
        input.from_location_id,
        input.product_id,
        tx,
      );
      const toBalance = await this.inventoryRepository.lockStockBalance(
        input.business_id,
        input.branch_id,
        input.to_location_id,
        input.product_id,
        tx,
      );

      const availableOrigin =
        (fromBalance?.quantity ?? 0) - (fromBalance?.reservedQuantity ?? 0);

      if (availableOrigin < input.quantity) {
        throw new BadRequestException(
          'No hay stock suficiente en la ubicacion origen.',
        );
      }

      const transferReferenceId = randomUUID();
      const nextOriginQuantity = (fromBalance?.quantity ?? 0) - input.quantity;
      const nextDestinationQuantity =
        (toBalance?.quantity ?? 0) + input.quantity;

      if (fromBalance) {
        await this.inventoryRepository.updateStockBalance(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: input.from_location_id,
            productId: input.product_id,
            quantity: nextOriginQuantity,
          },
          tx,
        );
      }

      if (toBalance) {
        await this.inventoryRepository.updateStockBalance(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: input.to_location_id,
            productId: input.product_id,
            quantity: nextDestinationQuantity,
          },
          tx,
        );
      } else {
        await this.inventoryRepository.insertStockBalance(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: input.to_location_id,
            productId: input.product_id,
            quantity: input.quantity,
          },
          tx,
        );
      }

      await this.inventoryRepository.createInventoryMovement(
        {
          businessId: input.business_id,
          branchId: input.branch_id,
          locationId: input.from_location_id,
          productId: input.product_id,
          movementType: InventoryMovementType.TRANSFER_OUT,
          quantity: input.quantity,
          referenceType: 'inventory_transfer',
          referenceId: transferReferenceId,
          unitCost: product.costPrice,
          notes: input.notes?.trim() || 'Transferencia de inventario',
          actorUserId: user.id,
        },
        tx,
      );

      await this.inventoryRepository.createInventoryMovement(
        {
          businessId: input.business_id,
          branchId: input.branch_id,
          locationId: input.to_location_id,
          productId: input.product_id,
          movementType: InventoryMovementType.TRANSFER_IN,
          quantity: input.quantity,
          referenceType: 'inventory_transfer',
          referenceId: transferReferenceId,
          unitCost: product.costPrice,
          notes: input.notes?.trim() || 'Transferencia de inventario',
          actorUserId: user.id,
        },
        tx,
      );

      await this.syncLowStockAlerts(input.business_id, input.branch_id, tx);

      const response = {
        transfer_id: transferReferenceId,
        product_id: product.id,
        product_name: product.name,
        quantity: input.quantity,
        from_location_id: fromLocation.id,
        from_location_name: fromLocation.name,
        to_location_id: toLocation.id,
        to_location_name: toLocation.name,
        notes: input.notes?.trim() || 'Transferencia de inventario',
        created_at: new Date(),
      };

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'create_inventory_transfer',
        entityType: 'inventory_transfer',
        entityId: transferReferenceId,
        afterJson: response,
        tx,
      });

      return response;
    });
  }

  async listInventoryAlerts(query: ListInventoryAlertsDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    return this.prisma.$transaction(async (tx) => {
      await this.syncLowStockAlerts(query.business_id, query.branch_id, tx);

      const alerts = await this.inventoryRepository.listInventoryAlerts(
        query.business_id,
        query.branch_id,
        {
          status: query.status ?? StockAlertStatus.ACTIVE,
          limit: query.limit,
        },
        tx,
      );

      return alerts.map((alert) => this.buildInventoryAlertResponse(alert));
    });
  }

  async setInventoryAlertStatus(
    alertId: string,
    input: SetAlertStatusDto,
    user: RequestUser,
    status: StockAlertStatus.RESOLVED | StockAlertStatus.DISMISSED,
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
    await this.assertInventoryWriteAccess(
      user,
      input.business_id,
      input.branch_id,
    );

    return this.prisma.$transaction(async (tx) => {
      const currentAlert = await this.inventoryRepository.getInventoryAlertById(
        input.business_id,
        input.branch_id,
        alertId,
        tx,
      );

      if (!currentAlert) {
        throw new NotFoundException('Alerta no encontrada.');
      }

      const currentMetadata =
        currentAlert.metadata && typeof currentAlert.metadata === 'object'
          ? currentAlert.metadata
          : {};
      const nowIso = new Date().toISOString();
      const nextMetadata =
        status === StockAlertStatus.RESOLVED
          ? { ...currentMetadata, resolvedAt: nowIso }
          : { ...currentMetadata, dismissedAt: nowIso };

      const updatedAlert = await this.inventoryRepository.updateInventoryAlert(
        {
          alertId,
          businessId: input.business_id,
          branchId: input.branch_id,
          status,
          metadata: nextMetadata,
        },
        tx,
      );

      if (!updatedAlert) {
        throw new NotFoundException('Alerta no encontrada.');
      }

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action:
          status === StockAlertStatus.RESOLVED
            ? 'resolve_inventory_alert'
            : 'dismiss_inventory_alert',
        entityType: 'alert',
        entityId: alertId,
        beforeJson: currentAlert,
        afterJson: updatedAlert,
        tx,
      });

      return this.buildInventoryAlertResponse(updatedAlert);
    });
  }

  async getCatalogs(query: GetInventoryCatalogsDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.assertInventoryReadAccess(
      user,
      query.business_id,
      query.branch_id,
    );

    const [categories, brands, taxRates, suppliers, locations] =
      await Promise.all([
        this.inventoryRepository.listCategories(query.business_id),
        this.inventoryRepository.listBrands(query.business_id),
        this.inventoryRepository.listTaxRates(query.business_id),
        this.inventoryRepository.listSuppliers(query.business_id),
        this.inventoryRepository.listLocations(
          query.business_id,
          query.branch_id,
        ),
      ]);

    return {
      categories,
      brands,
      taxRates,
      suppliers,
      locations,
    };
  }

  async createCategory(input: CreateCategoryDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.assertInventoryWriteAccess(user, input.business_id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const category = await this.inventoryRepository.createCategory(
          {
            businessId: input.business_id,
            name: input.name.trim(),
            description: input.description?.trim() || null,
          },
          tx,
        );

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'create_category',
          entityType: 'category',
          entityId: category.id,
          afterJson: category,
          tx,
        });

        return category;
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Ya existe una categoria con ese nombre.');
      }

      throw error;
    }
  }

  async createBrand(input: CreateBrandDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.assertInventoryWriteAccess(user, input.business_id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const brand = await this.inventoryRepository.createBrand(
          {
            businessId: input.business_id,
            name: input.name.trim(),
            description: input.description?.trim() || null,
          },
          tx,
        );

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'create_brand',
          entityType: 'brand',
          entityId: brand.id,
          afterJson: brand,
          tx,
        });

        return brand;
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Ya existe una marca con ese nombre.');
      }

      throw error;
    }
  }

  async createTaxRate(input: CreateTaxRateDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.assertInventoryWriteAccess(user, input.business_id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const taxRate = await this.inventoryRepository.createTaxRate(
          {
            businessId: input.business_id,
            name: input.name.trim(),
            rate: input.rate,
          },
          tx,
        );

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'create_tax_rate',
          entityType: 'tax_rate',
          entityId: taxRate.id,
          afterJson: taxRate,
          tx,
        });

        return taxRate;
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Ya existe una tasa con ese nombre.');
      }

      throw error;
    }
  }

  async createSupplier(input: CreateSupplierDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.assertInventoryWriteAccess(user, input.business_id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const supplier = await this.inventoryRepository.createSupplier(
          {
            businessId: input.business_id,
            name: input.name.trim(),
            contactName: input.contact_name?.trim() || null,
            email: input.email?.trim() || null,
            phone: input.phone?.trim() || null,
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

        return supplier;
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Ya existe un proveedor con ese nombre.');
      }

      throw error;
    }
  }

  async createStockAdjustment(
    input: CreateStockAdjustmentDto,
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
    await this.assertInventoryWriteAccess(
      user,
      input.business_id,
      input.branch_id,
    );

    return this.prisma.$transaction(async (tx) => {
      const locationBelongsToBranch =
        await this.inventoryRepository.assertLocationBelongsToBranch(
          input.business_id,
          input.branch_id,
          input.location_id,
          tx,
        );

      if (!locationBelongsToBranch) {
        throw new NotFoundException(
          'La ubicacion de inventario no pertenece a la sucursal.',
        );
      }

      const product = await this.inventoryRepository.getProductById(
        input.business_id,
        input.product_id,
        tx,
      );

      if (!product) {
        throw new NotFoundException('Producto no encontrado para el ajuste.');
      }

      const lockedBalance = await this.inventoryRepository.lockStockBalance(
        input.business_id,
        input.branch_id,
        input.location_id,
        input.product_id,
        tx,
      );
      const previousQuantity = lockedBalance?.quantity ?? 0;
      const difference = input.new_quantity - previousQuantity;

      if (input.new_quantity < 0) {
        throw new BadRequestException(
          'La nueva cantidad no puede ser negativa.',
        );
      }

      if (lockedBalance) {
        await this.inventoryRepository.updateStockBalance(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: input.location_id,
            productId: input.product_id,
            quantity: input.new_quantity,
          },
          tx,
        );
      } else {
        await this.inventoryRepository.insertStockBalance(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: input.location_id,
            productId: input.product_id,
            quantity: input.new_quantity,
          },
          tx,
        );
      }

      if (difference !== 0) {
        await this.inventoryRepository.createInventoryMovement(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: input.location_id,
            productId: input.product_id,
            movementType:
              difference > 0
                ? InventoryMovementType.ADJUSTMENT_IN
                : InventoryMovementType.ADJUSTMENT_OUT,
            quantity: Math.abs(difference),
            referenceType: 'stock_adjustment',
            referenceId: input.product_id,
            notes: input.reason,
            actorUserId: user.id,
          },
          tx,
        );

        await this.syncLowStockAlerts(input.business_id, input.branch_id, tx);
      }

      const result = {
        business_id: input.business_id,
        branch_id: input.branch_id,
        location_id: input.location_id,
        product_id: input.product_id,
        previous_quantity: previousQuantity,
        new_quantity: input.new_quantity,
        difference,
        reason: input.reason,
      };

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'stock_adjustment',
        entityType: 'stock_balance',
        entityId: input.product_id,
        beforeJson: {
          quantity: previousQuantity,
        },
        afterJson: result,
        tx,
      });

      return result;
    });
  }

  async createInventoryEntry(
    input: CreateInventoryEntryDto,
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
    await this.assertInventoryWriteAccess(
      user,
      input.business_id,
      input.branch_id,
    );

    const locationBelongsToBranch =
      await this.inventoryRepository.assertLocationBelongsToBranch(
        input.business_id,
        input.branch_id,
        input.location_id,
      );

    if (!locationBelongsToBranch) {
      throw new NotFoundException(
        'La ubicacion seleccionada no pertenece a la sucursal.',
      );
    }

    if (input.supplier_id) {
      const supplier = await this.inventoryRepository.getSupplierById(
        input.business_id,
        input.supplier_id,
      );

      if (!supplier) {
        throw new NotFoundException(
          'El proveedor seleccionado no esta disponible.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const entry = await this.inventoryRepository.createGoodsReceipt(
        {
          businessId: input.business_id,
          branchId: input.branch_id,
          locationId: input.location_id,
          supplierId: input.supplier_id ?? null,
          notes: input.notes?.trim() || null,
          receivedBy: user.id,
        },
        tx,
      );

      const createdItems: Array<{
        product_id: string;
        product_name: string;
        quantity: number;
        unit_cost: number;
      }> = [];

      for (const item of input.items) {
        const product = await this.inventoryRepository.getProductById(
          input.business_id,
          item.product_id,
          tx,
        );

        if (!product) {
          throw new NotFoundException('Uno de los productos no existe.');
        }

        if (!product.isActive) {
          throw new BadRequestException(
            'No puedes registrar entradas para un articulo inactivo.',
          );
        }

        const lockedBalance = await this.inventoryRepository.lockStockBalance(
          input.business_id,
          input.branch_id,
          input.location_id,
          item.product_id,
          tx,
        );

        const nextQuantity = (lockedBalance?.quantity ?? 0) + item.quantity;

        if (lockedBalance) {
          await this.inventoryRepository.updateStockBalance(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: input.location_id,
              productId: item.product_id,
              quantity: nextQuantity,
            },
            tx,
          );
        } else {
          await this.inventoryRepository.insertStockBalance(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: input.location_id,
              productId: item.product_id,
              quantity: item.quantity,
            },
            tx,
          );
        }

        const unitCost = item.unit_cost ?? product.costPrice;

        await this.inventoryRepository.createGoodsReceiptItem(
          {
            goodsReceiptId: entry.id,
            productId: item.product_id,
            quantity: item.quantity,
            unitCost,
          },
          tx,
        );

        await this.inventoryRepository.createInventoryMovement(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: input.location_id,
            productId: item.product_id,
            movementType: InventoryMovementType.PURCHASE_IN,
            quantity: item.quantity,
            referenceType: 'goods_receipt',
            referenceId: entry.id,
            unitCost,
            notes: input.notes?.trim() || 'Entrada de inventario',
            actorUserId: user.id,
          },
          tx,
        );

        createdItems.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          unit_cost: unitCost,
        });
      }

      await this.syncLowStockAlerts(input.business_id, input.branch_id, tx);

      const response = {
        entry_id: entry.id,
        location_id: entry.locationId,
        supplier_id: entry.supplierId,
        items: createdItems,
        created_at: entry.createdAt,
      };

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'create_inventory_entry',
        entityType: 'goods_receipt',
        entityId: entry.id,
        afterJson: response,
        tx,
      });

      return response;
    });
  }
}
