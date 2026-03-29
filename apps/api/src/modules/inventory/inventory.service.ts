import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { StockService } from '../shared-db/stock.service';
import type { CreateBrandDto } from './dto/create-brand.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { CreateInventoryEntryDto } from './dto/create-inventory-entry.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { CreateSupplierDto } from './dto/create-supplier.dto';
import type { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import type { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import type { DeactivateProductDto } from './dto/deactivate-product.dto';
import type { GetDefaultLocationDto } from './dto/get-default-location.dto';
import type { GetInventoryCatalogsDto } from './dto/get-inventory-catalogs.dto';
import type { GetProductDetailDto } from './dto/get-product-detail.dto';
import type { GetProductMovementsDto } from './dto/get-product-movements.dto';
import type { GetProductStockDto } from './dto/get-product-stock.dto';
import type { ListProductsDto } from './dto/list-products.dto';
import type { ReactivateProductDto } from './dto/reactivate-product.dto';
import type { SearchProductsDto } from './dto/search-products.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
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

  private isDuplicateKeyError(error: unknown) {
    return error instanceof Error && /duplicate key value/i.test(error.message);
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

    const product = await this.inventoryRepository.getProductById(
      query.business_id,
      productId,
    );

    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    return this.inventoryRepository.listProductMovements(
      query.business_id,
      query.branch_id,
      productId,
      query.limit ?? 20,
    );
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

    return this.stockService.getDefaultInventoryLocationByBranch(
      query.business_id,
      query.branch_id,
    );
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
