import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { StockService } from '../shared-db/stock.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import type { DeactivateProductDto } from './dto/deactivate-product.dto';
import type { GetDefaultLocationDto } from './dto/get-default-location.dto';
import type { GetProductStockDto } from './dto/get-product-stock.dto';
import type { SearchProductsDto } from './dto/search-products.dto';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(
    private readonly auditService: AuditService,
    private readonly businessAccessService: BusinessAccessService,
    private readonly inventoryRepository: InventoryRepository,
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  async searchProducts(query: SearchProductsDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchBelongsToBusiness(
      query.branch_id,
      query.business_id,
    );

    return this.inventoryRepository.searchProducts(
      query.business_id,
      query.branch_id,
      query.query ?? '',
    );
  }

  async createProduct(input: CreateProductDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBranchBelongsToBusiness(
      input.branch_id,
      input.business_id,
    );

    if (!input.track_inventory && (input.initial_stock ?? 0) > 0) {
      throw new BadRequestException(
        'No puedes asignar stock inicial a un producto que no controla inventario.',
      );
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

        if (input.barcode?.trim()) {
          await this.inventoryRepository.createProductBarcode(
            {
              productId: product.id,
              barcode: input.barcode.trim(),
              isPrimary: true,
            },
            tx,
          );
        }

        const initialStock = input.initial_stock ?? 0;
        let defaultLocation: Awaited<
          ReturnType<StockService['getDefaultInventoryLocationByBranch']>
        > | null = null;

        if (input.track_inventory && initialStock > 0) {
          defaultLocation =
            await this.stockService.getDefaultInventoryLocationByBranch(
              input.business_id,
              input.branch_id,
              tx,
            );

          await this.inventoryRepository.insertStockBalance(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: defaultLocation.id,
              productId: product.id,
              quantity: initialStock,
            },
            tx,
          );

          await this.inventoryRepository.createInventoryMovement(
            {
              businessId: input.business_id,
              branchId: input.branch_id,
              locationId: defaultLocation.id,
              productId: product.id,
              movementType: InventoryMovementType.ADJUSTMENT_IN,
              quantity: initialStock,
              reason: 'Stock inicial de alta de producto',
              actorUserId: user.id,
            },
            tx,
          );
        }

        const result = {
          product_id: product.id,
          business_id: product.businessId,
          name: product.name,
          sku: product.sku,
          sale_price: product.salePrice,
          cost_price: product.costPrice,
          track_inventory: product.trackInventory,
          initial_stock: initialStock,
          location_id: defaultLocation?.id ?? null,
          created_at: product.createdAt,
        };

        await this.auditService.logAction({
          businessId: input.business_id,
          actorUserId: user.id,
          action: 'create_product',
          entityType: 'product',
          entityId: product.id,
          afterJson: result,
          tx,
        });

        return result;
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key value')
      ) {
        throw new ConflictException(
          'El SKU o código de barras ya existe para este negocio.',
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

  async getProductStock(
    productId: string,
    query: GetProductStockDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchBelongsToBusiness(
      query.branch_id,
      query.business_id,
    );

    const product = await this.inventoryRepository.getProductById(
      query.business_id,
      productId,
    );

    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    const availableStock = await this.stockService.getAvailableStock(
      query.business_id,
      query.branch_id,
      productId,
      query.location_id,
    );

    return {
      product_id: product.id,
      product_name: product.name,
      track_inventory: product.trackInventory,
      quantity: availableStock,
      location_id: query.location_id ?? null,
    };
  }

  async getDefaultLocation(query: GetDefaultLocationDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchBelongsToBusiness(
      query.branch_id,
      query.business_id,
    );

    return this.stockService.getDefaultInventoryLocationByBranch(
      query.business_id,
      query.branch_id,
    );
  }

  async createStockAdjustment(
    input: CreateStockAdjustmentDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBranchBelongsToBusiness(
      input.branch_id,
      input.business_id,
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
          'La ubicación de inventario no pertenece a la sucursal o negocio.',
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
            reason: input.reason,
            actorUserId: user.id,
          },
          tx,
        );
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
}
