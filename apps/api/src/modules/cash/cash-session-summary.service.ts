import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { buildSaleFolio, getPaymentMethodLabel } from '../sales/sales.utils';
import {
  type CashMovementRecord,
  type CashSessionDetailRecord,
  type CashSessionSalePreviewRecord,
  CashRepository,
} from './cash.repository';

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export interface PaymentTotals {
  cash: number;
  card: number;
  transfer: number;
  mixed: number;
  store_credit: number;
}

@Injectable()
export class CashSessionSummaryService {
  constructor(private readonly cashRepository: CashRepository) {}

  private buildPaymentTotals(
    rows: Array<{ paymentMethod: string; amount: number }>,
  ): PaymentTotals {
    const totals: PaymentTotals = {
      cash: 0,
      card: 0,
      transfer: 0,
      mixed: 0,
      store_credit: 0,
    };

    for (const row of rows) {
      if (row.paymentMethod in totals) {
        totals[row.paymentMethod as keyof PaymentTotals] = roundCurrency(
          row.amount,
        );
      }
    }

    return totals;
  }

  private buildMovementTotals(movements: CashMovementRecord[]) {
    return movements.reduce(
      (accumulator, movement) => {
        if (movement.movementType === 'income') {
          accumulator.manualIncomeTotal = roundCurrency(
            accumulator.manualIncomeTotal + movement.amount,
          );
        }

        if (movement.movementType === 'expense') {
          accumulator.manualExpenseTotal = roundCurrency(
            accumulator.manualExpenseTotal + movement.amount,
          );
        }

        return accumulator;
      },
      {
        manualIncomeTotal: 0,
        manualExpenseTotal: 0,
      },
    );
  }

  private buildSessionSalesPreview(sales: CashSessionSalePreviewRecord[]) {
    return sales.map((sale) => ({
      id: sale.id,
      folio: buildSaleFolio(sale.id, sale.createdAt),
      total: roundCurrency(sale.total),
      customerName: sale.customerName,
      paymentMethodLabel:
        sale.paymentMethodsCount > 1
          ? 'Mixto'
          : getPaymentMethodLabel(sale.primaryPaymentMethod ?? 'cash'),
      createdAt: sale.createdAt,
    }));
  }

  async getSummary(
    cashSessionId: string,
    tx?: PrismaExecutor,
  ): Promise<{
    session: CashSessionDetailRecord;
    totals: {
      sales_total: number;
      sales_count: number;
      payment_totals: PaymentTotals;
      manual_income_total: number;
      manual_expense_total: number;
      expected_cash: number;
    };
    sales: Array<{
      id: string;
      folio: string;
      total: number;
      customerName: string | null;
      paymentMethodLabel: string;
      createdAt: Date;
    }>;
    movements: CashMovementRecord[];
  }> {
    const session = await this.cashRepository.getCashSessionById(
      cashSessionId,
      tx,
    );

    if (!session) {
      throw new NotFoundException('La sesion de caja no existe.');
    }

    const salesOverview = await this.cashRepository.getCashSessionSalesOverview(
      cashSessionId,
      tx,
    );
    const paymentTotalsRows =
      await this.cashRepository.getPaymentTotalsByMethod(cashSessionId, tx);
    const movements = await this.cashRepository.getCashMovements(
      cashSessionId,
      tx,
    );
    const sales = await this.cashRepository.getCashSessionSalesPreview(
      cashSessionId,
      20,
      tx,
    );

    const paymentTotals = this.buildPaymentTotals(paymentTotalsRows);
    const movementTotals = this.buildMovementTotals(movements);
    const expectedCash = roundCurrency(
      session.openingAmount +
        paymentTotals.cash +
        movementTotals.manualIncomeTotal -
        movementTotals.manualExpenseTotal,
    );

    return {
      session,
      totals: {
        sales_total: roundCurrency(salesOverview.salesTotal),
        sales_count: roundCurrency(salesOverview.salesCount),
        payment_totals: paymentTotals,
        manual_income_total: movementTotals.manualIncomeTotal,
        manual_expense_total: movementTotals.manualExpenseTotal,
        expected_cash: expectedCash,
      },
      sales: this.buildSessionSalesPreview(sales),
      movements,
    };
  }
}
