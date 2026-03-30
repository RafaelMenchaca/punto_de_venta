import { Injectable } from '@nestjs/common';
import { REPORT_READ_ROLES } from '../../common/authz/role-groups';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { CashRepository } from '../cash/cash.repository';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import type { GetSalesReportDto } from './dto/get-sales-report.dto';
import type { GetCashSessionsReportDto } from './dto/get-cash-sessions-report.dto';
import type { GetInventoryValuationReportDto } from './dto/get-inventory-valuation-report.dto';
import { ReportsRepository } from './reports.repository';
import {
  buildCashSessionFolio,
  buildReportPaymentTotals,
  buildSaleFolio,
  getReportPaymentMethodLabel,
  roundCurrency,
} from './reports.utils';

@Injectable()
export class ReportsService {
  constructor(
    private readonly businessAccessService: BusinessAccessService,
    private readonly cashRepository: CashRepository,
    private readonly reportsRepository: ReportsRepository,
  ) {}

  async getSalesReport(query: GetSalesReportDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );

    if (query.branch_id) {
      await this.businessAccessService.assertBranchAccess(
        user.id,
        query.business_id,
        query.branch_id,
      );
    }
    await this.businessAccessService.assertBusinessRole(
      user.id,
      query.business_id,
      REPORT_READ_ROLES,
      query.branch_id,
      'No tienes permiso para consultar reportes.',
    );

    const [summaryRow, paymentRows, statusRows, itemRows] = await Promise.all([
      this.reportsRepository.getSalesReportSummary({
        businessId: query.business_id,
        branchId: query.branch_id,
        registerId: query.register_id,
        dateFrom: query.date_from,
        dateTo: query.date_to,
      }),
      this.reportsRepository.getSalesReportPaymentTotals({
        businessId: query.business_id,
        branchId: query.branch_id,
        registerId: query.register_id,
        dateFrom: query.date_from,
        dateTo: query.date_to,
      }),
      this.reportsRepository.getSalesReportStatusBreakdown({
        businessId: query.business_id,
        branchId: query.branch_id,
        registerId: query.register_id,
        dateFrom: query.date_from,
        dateTo: query.date_to,
      }),
      this.reportsRepository.listSalesReportItems({
        businessId: query.business_id,
        branchId: query.branch_id,
        registerId: query.register_id,
        dateFrom: query.date_from,
        dateTo: query.date_to,
      }),
    ]);

    return {
      filters: {
        dateFrom: query.date_from ?? null,
        dateTo: query.date_to ?? null,
        branchId: query.branch_id ?? null,
        registerId: query.register_id ?? null,
      },
      summary: {
        totalSales: roundCurrency(summaryRow.totalSales),
        salesCount: roundCurrency(summaryRow.salesCount),
        averageTicket: roundCurrency(summaryRow.averageTicket),
        paymentTotals: buildReportPaymentTotals(paymentRows),
        salesByStatus: statusRows.map((row) => ({
          status: row.status,
          count: roundCurrency(row.count),
          total: roundCurrency(row.total),
        })),
      },
      items: itemRows.map((item) => ({
        id: item.id,
        folio: buildSaleFolio(item.id, item.createdAt),
        status: item.status,
        paymentStatus: item.paymentStatus,
        customerName: item.customerName,
        cashierName: item.cashierName,
        total: roundCurrency(item.total),
        paymentMethodLabel: getReportPaymentMethodLabel({
          paymentMethodsCount: item.paymentMethodsCount,
          primaryPaymentMethod: item.primaryPaymentMethod,
        }),
        createdAt: item.createdAt,
      })),
    };
  }

  async getCashSessionsReport(
    query: GetCashSessionsReportDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );

    if (query.branch_id) {
      await this.businessAccessService.assertBranchAccess(
        user.id,
        query.business_id,
        query.branch_id,
      );
    }
    await this.businessAccessService.assertBusinessRole(
      user.id,
      query.business_id,
      REPORT_READ_ROLES,
      query.branch_id,
      'No tienes permiso para consultar reportes.',
    );

    const sessions = await this.cashRepository.listCashSessions(
      query.business_id,
      {
        branchId: query.branch_id,
        registerId: query.register_id,
        dateFrom: query.date_from,
        dateTo: query.date_to,
        limit: 100,
      },
    );

    return {
      filters: {
        dateFrom: query.date_from ?? null,
        dateTo: query.date_to ?? null,
        branchId: query.branch_id ?? null,
        registerId: query.register_id ?? null,
      },
      summary: {
        sessionsCount: roundCurrency(sessions.length),
        expectedCash: roundCurrency(
          sessions.reduce((sum, session) => sum + session.expectedCash, 0),
        ),
        countedCash: roundCurrency(
          sessions.reduce(
            (sum, session) => sum + (session.closingCounted ?? 0),
            0,
          ),
        ),
        differenceAmount: roundCurrency(
          sessions.reduce(
            (sum, session) => sum + (session.differenceAmount ?? 0),
            0,
          ),
        ),
        salesTotal: roundCurrency(
          sessions.reduce((sum, session) => sum + session.salesTotal, 0),
        ),
      },
      items: sessions.map((session) => ({
        id: session.id,
        folio: buildCashSessionFolio(session.id, session.openedAt),
        branchName: session.branchName,
        registerName: session.registerName,
        status: session.status,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        openingAmount: roundCurrency(session.openingAmount),
        closingExpected:
          session.closingExpected !== null
            ? roundCurrency(session.closingExpected)
            : null,
        closingCounted:
          session.closingCounted !== null
            ? roundCurrency(session.closingCounted)
            : null,
        differenceAmount:
          session.differenceAmount !== null
            ? roundCurrency(session.differenceAmount)
            : null,
        salesTotal: roundCurrency(session.salesTotal),
        manualIncomeTotal: roundCurrency(session.manualIncomeTotal),
        manualExpenseTotal: roundCurrency(session.manualExpenseTotal),
        paymentTotals: {
          cash: roundCurrency(session.cashTotal),
          card: roundCurrency(session.cardTotal),
          transfer: roundCurrency(session.transferTotal),
          mixed: roundCurrency(session.mixedTotal),
          store_credit: roundCurrency(session.storeCreditTotal),
        },
      })),
    };
  }

  async getInventoryValuationReport(
    query: GetInventoryValuationReportDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );

    if (query.branch_id) {
      await this.businessAccessService.assertBranchAccess(
        user.id,
        query.business_id,
        query.branch_id,
      );
    }
    await this.businessAccessService.assertBusinessRole(
      user.id,
      query.business_id,
      REPORT_READ_ROLES,
      query.branch_id,
      'No tienes permiso para consultar reportes.',
    );

    const items = await this.reportsRepository.listInventoryValuation({
      businessId: query.business_id,
      branchId: query.branch_id,
    });

    return {
      filters: {
        dateFrom: null,
        dateTo: null,
        branchId: query.branch_id ?? null,
      },
      summary: {
        itemsCount: roundCurrency(items.length),
        totalStockValue: roundCurrency(
          items.reduce((sum, item) => sum + item.estimatedValue, 0),
        ),
      },
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        stockTotal: roundCurrency(item.stockTotal),
        unitCost: roundCurrency(item.unitCost),
        estimatedValue: roundCurrency(item.estimatedValue),
        locationName: item.locationName,
      })),
    };
  }
}
