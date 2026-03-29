import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListPurchaseOrdersDto } from './dto/list-purchase-orders.dto';
import { ListSuppliersDto } from './dto/list-suppliers.dto';
import { SetSupplierActiveDto } from './dto/set-supplier-active.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PurchasingService } from './purchasing.service';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Get('suppliers')
  listSuppliers(
    @Query() query: ListSuppliersDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.listSuppliers(query, user);
  }

  @Post('suppliers')
  createSupplier(
    @Body() body: CreateSupplierDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.createSupplier(body, user);
  }

  @Patch('suppliers/:supplierId')
  updateSupplier(
    @Param('supplierId', new ParseUUIDPipe()) supplierId: string,
    @Body() body: UpdateSupplierDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.updateSupplier(supplierId, body, user);
  }

  @Post('suppliers/:supplierId/deactivate')
  deactivateSupplier(
    @Param('supplierId', new ParseUUIDPipe()) supplierId: string,
    @Body() body: SetSupplierActiveDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.setSupplierActive(
      supplierId,
      body,
      user,
      false,
    );
  }

  @Post('suppliers/:supplierId/reactivate')
  reactivateSupplier(
    @Param('supplierId', new ParseUUIDPipe()) supplierId: string,
    @Body() body: SetSupplierActiveDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.setSupplierActive(
      supplierId,
      body,
      user,
      true,
    );
  }

  @Get('purchase-orders')
  listPurchaseOrders(
    @Query() query: ListPurchaseOrdersDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.listPurchaseOrders(query, user);
  }

  @Post('purchase-orders')
  createPurchaseOrder(
    @Body() body: CreatePurchaseOrderDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.createPurchaseOrder(body, user);
  }

  @Get('purchase-orders/:purchaseOrderId')
  getPurchaseOrderDetail(
    @Param('purchaseOrderId', new ParseUUIDPipe()) purchaseOrderId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.getPurchaseOrderDetail(purchaseOrderId, user);
  }

  @Patch('purchase-orders/:purchaseOrderId')
  updatePurchaseOrder(
    @Param('purchaseOrderId', new ParseUUIDPipe()) purchaseOrderId: string,
    @Body() body: UpdatePurchaseOrderDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.updatePurchaseOrder(
      purchaseOrderId,
      body,
      user,
    );
  }

  @Post('purchase-orders/:purchaseOrderId/submit')
  submitPurchaseOrder(
    @Param('purchaseOrderId', new ParseUUIDPipe()) purchaseOrderId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.submitPurchaseOrder(purchaseOrderId, user);
  }

  @Post('purchase-orders/:purchaseOrderId/cancel')
  cancelPurchaseOrder(
    @Param('purchaseOrderId', new ParseUUIDPipe()) purchaseOrderId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.cancelPurchaseOrder(purchaseOrderId, user);
  }

  @Get('goods-receipts')
  listGoodsReceipts(
    @Query() query: ListPurchaseOrdersDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.listGoodsReceipts(query, user);
  }

  @Post('goods-receipts')
  createGoodsReceipt(
    @Body() body: CreateGoodsReceiptDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.createGoodsReceipt(body, user);
  }

  @Get('goods-receipts/:goodsReceiptId')
  getGoodsReceiptDetail(
    @Param('goodsReceiptId', new ParseUUIDPipe()) goodsReceiptId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchasingService.getGoodsReceiptDetail(goodsReceiptId, user);
  }
}
