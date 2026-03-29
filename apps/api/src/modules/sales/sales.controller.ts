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
import { CreateSaleDto } from './dto/create-sale.dto';
import { GetSalesDto } from './dto/get-sales.dto';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  getSales(@Query() query: GetSalesDto, @CurrentUser() user: RequestUser) {
    return this.salesService.getSales(query, user);
  }

  @Get(':saleId')
  getSaleDetail(
    @Param('saleId', new ParseUUIDPipe()) saleId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.salesService.getSaleDetail(saleId, user);
  }

  @Get(':saleId/refunds')
  getSaleRefunds(
    @Param('saleId', new ParseUUIDPipe()) saleId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.salesService.getSaleRefunds(saleId, user);
  }

  @Post()
  createSale(@Body() body: CreateSaleDto, @CurrentUser() user: RequestUser) {
    return this.salesService.createSale(body, user);
  }

  @Post(':saleId/cancel')
  cancelSale(
    @Param('saleId', new ParseUUIDPipe()) saleId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.salesService.cancelSale(saleId, user);
  }
}
