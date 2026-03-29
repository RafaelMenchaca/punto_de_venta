import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateRefundDto } from './dto/create-refund.dto';
import { SalesService } from './sales.service';

@Controller('refunds')
export class RefundsController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  createRefund(
    @Body() body: CreateRefundDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.salesService.createRefund(body, user);
  }
}
