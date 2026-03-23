import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { GetDefaultLocationDto } from './dto/get-default-location.dto';
import { GetProductStockDto } from './dto/get-product-stock.dto';
import { SearchProductsDto } from './dto/search-products.dto';
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

  @Get('products/:productId/stock')
  getProductStock(
    @Param('productId') productId: string,
    @Query() query: GetProductStockDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.getProductStock(productId, query, user);
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
}
