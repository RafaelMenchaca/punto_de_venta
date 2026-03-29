import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { StockAlertStatus } from '../../common/enums/stock-alert-status.enum';
import { CreateLocationDto } from './dto/create-location.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateInventoryEntryDto } from './dto/create-inventory-entry.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { DeactivateProductDto } from './dto/deactivate-product.dto';
import { GetDefaultLocationDto } from './dto/get-default-location.dto';
import { GetInventoryCatalogsDto } from './dto/get-inventory-catalogs.dto';
import { ListInventoryAlertsDto } from './dto/list-inventory-alerts.dto';
import { ListInventoryMovementsDto } from './dto/list-inventory-movements.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { GetProductDetailDto } from './dto/get-product-detail.dto';
import { GetProductMovementsDto } from './dto/get-product-movements.dto';
import { GetProductStockDto } from './dto/get-product-stock.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { ReactivateProductDto } from './dto/reactivate-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { SetAlertStatusDto } from './dto/set-alert-status.dto';
import { SetLocationActiveDto } from './dto/set-location-active.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
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

  @Get('locations')
  listLocations(
    @Query() query: ListLocationsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.listLocations(query, user);
  }

  @Post('locations')
  createLocation(
    @Body() body: CreateLocationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.createLocation(body, user);
  }

  @Patch('locations/:locationId')
  updateLocation(
    @Param('locationId', new ParseUUIDPipe()) locationId: string,
    @Body() body: UpdateLocationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.updateLocation(locationId, body, user);
  }

  @Post('locations/:locationId/deactivate')
  deactivateLocation(
    @Param('locationId', new ParseUUIDPipe()) locationId: string,
    @Body() body: SetLocationActiveDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.setLocationActive(
      locationId,
      body,
      user,
      false,
    );
  }

  @Post('locations/:locationId/reactivate')
  reactivateLocation(
    @Param('locationId', new ParseUUIDPipe()) locationId: string,
    @Body() body: SetLocationActiveDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.setLocationActive(
      locationId,
      body,
      user,
      true,
    );
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

  @Post('transfers')
  createTransfer(
    @Body() body: CreateTransferDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.createTransfer(body, user);
  }

  @Get('movements')
  listInventoryMovements(
    @Query() query: ListInventoryMovementsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.listInventoryMovements(query, user);
  }

  @Get('alerts')
  listInventoryAlerts(
    @Query() query: ListInventoryAlertsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.listInventoryAlerts(query, user);
  }

  @Post('alerts/:alertId/resolve')
  resolveInventoryAlert(
    @Param('alertId', new ParseUUIDPipe()) alertId: string,
    @Body() body: SetAlertStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.setInventoryAlertStatus(
      alertId,
      body,
      user,
      StockAlertStatus.RESOLVED,
    );
  }

  @Post('alerts/:alertId/dismiss')
  dismissInventoryAlert(
    @Param('alertId', new ParseUUIDPipe()) alertId: string,
    @Body() body: SetAlertStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.setInventoryAlertStatus(
      alertId,
      body,
      user,
      StockAlertStatus.DISMISSED,
    );
  }
}
