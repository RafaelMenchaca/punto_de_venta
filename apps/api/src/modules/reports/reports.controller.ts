import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { ReportsService } from './reports.service';
import { GetCashSessionsReportDto } from './dto/get-cash-sessions-report.dto';
import { GetInventoryValuationReportDto } from './dto/get-inventory-valuation-report.dto';
import { GetSalesReportDto } from './dto/get-sales-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSalesReport(
    @Query() query: GetSalesReportDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reportsService.getSalesReport(query, user);
  }

  @Get('cash-sessions')
  getCashSessionsReport(
    @Query() query: GetCashSessionsReportDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reportsService.getCashSessionsReport(query, user);
  }

  @Get('inventory-valuation')
  getInventoryValuationReport(
    @Query() query: GetInventoryValuationReportDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reportsService.getInventoryValuationReport(query, user);
  }
}
