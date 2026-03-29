import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateInventoryEntryDto } from './dto/create-inventory-entry.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { DeactivateProductDto } from './dto/deactivate-product.dto';
import { GetDefaultLocationDto } from './dto/get-default-location.dto';
import { GetInventoryCatalogsDto } from './dto/get-inventory-catalogs.dto';
import { GetProductDetailDto } from './dto/get-product-detail.dto';
import { GetProductMovementsDto } from './dto/get-product-movements.dto';
import { GetProductStockDto } from './dto/get-product-stock.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { ReactivateProductDto } from './dto/reactivate-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('products/search')
  searchProducts(
    @Query() query: SearchProductsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.searchProducts(query, user);
  }

  @Get('products')
  listProducts(
    @Query() query: ListProductsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.listProducts(query, user);
  }

  @Post('products')
  createProduct(
    @Body() body: CreateProductDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.createProduct(body, user);
  }

  @Get('products/:productId')
  getProductDetail(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Query() query: GetProductDetailDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.getProductDetail(productId, query, user);
  }

  @Post('products/:productId/update')
  updateProduct(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() body: UpdateProductDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.updateProduct(productId, body, user);
  }

  @Post('products/:productId/deactivate')
  deactivateProduct(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() body: DeactivateProductDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.deactivateProduct(productId, body, user);
  }

  @Post('products/:productId/reactivate')
  reactivateProduct(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() body: ReactivateProductDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.reactivateProduct(productId, body, user);
  }

  @Get('products/:productId/stock')
  getProductStock(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Query() query: GetProductStockDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.getProductStock(productId, query, user);
  }

  @Get('products/:productId/movements')
  getProductMovements(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Query() query: GetProductMovementsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.getProductMovements(productId, query, user);
  }

  @Get('locations/default')
  getDefaultLocation(
    @Query() query: GetDefaultLocationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.getDefaultLocation(query, user);
  }

  @Post('stock-adjustments')
  createStockAdjustment(
    @Body() body: CreateStockAdjustmentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.createStockAdjustment(body, user);
  }

  @Get('catalogs')
  getCatalogs(
    @Query() query: GetInventoryCatalogsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.getCatalogs(query, user);
  }

  @Post('catalogs/categories')
  createCategory(
    @Body() body: CreateCategoryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.createCategory(body, user);
  }

  @Post('catalogs/brands')
  createBrand(@Body() body: CreateBrandDto, @CurrentUser() user: RequestUser) {
    return this.inventoryService.createBrand(body, user);
  }

  @Post('catalogs/tax-rates')
  createTaxRate(
    @Body() body: CreateTaxRateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.createTaxRate(body, user);
  }

  @Post('catalogs/suppliers')
  createSupplier(
    @Body() body: CreateSupplierDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.createSupplier(body, user);
  }

  @Post('entries')
  createInventoryEntry(
    @Body() body: CreateInventoryEntryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.createInventoryEntry(body, user);
  }
}
