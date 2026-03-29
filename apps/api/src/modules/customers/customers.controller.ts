import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { GetCustomersDto } from './dto/get-customers.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  getCustomers(
    @Query() query: GetCustomersDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.customersService.getCustomers(query, user);
  }

  @Post()
  createCustomer(
    @Body() body: CreateCustomerDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.customersService.createCustomer(body, user);
  }
}
