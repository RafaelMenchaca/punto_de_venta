import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { SaleStatus } from '../../common/enums/sale-status.enum';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { CashSessionLookupService } from '../shared-db/cash-session.service';
import { RegisterValidationService } from '../shared-db/register-validation.service';
import { StockService } from '../shared-db/stock.service';
import type { CreateRefundDto } from './dto/create-refund.dto';
import type { CreateSaleDto } from './dto/create-sale.dto';
import type { GetSalesDto } from './dto/get-sales.dto';
import {
  type PaymentRecord,
  type RefundItemRecord,
  type RefundRecord,
  SalesRepository,
  type SaleDetailRecord,
  type SaleItemRecord,
  type SaleListRecord,
} from './sales.repository';
import {
  allocateAmountByWeight,
  buildRefundFolio,
  buildSaleFolio,
  getPaymentMethodLabel,
  roundCurrency,
  roundQuantity,
} from './sales.utils';

const QUANTITY_EPSILON = 0.0005;

@Injectable()
export class SalesService {
  constructor(
    private readonly auditService: AuditService,
    private readonly businessAccessService: BusinessAccessService,
    private readonly cashSessionLookupService: CashSessionLookupService,
    private readonly prisma: PrismaService,
    private readonly registerValidationService: RegisterValidationService,
    private readonly salesRepository: SalesRepository,
    private readonly stockService: StockService,
  ) {}

  private async assertSaleAccess(
    sale: { businessId: string; branchId: string },
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      sale.businessId,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      sale.businessId,
      sale.branchId,
    );
  }

  private buildPaymentSummary(payments: PaymentRecord[]) {
    const methods = [
      ...new Set(payments.map((payment) => payment.paymentMethod)),
    ];
    const totalPaid = roundCurrency(
      payments.reduce((sum, payment) => sum + payment.amount, 0),
    );

    return {
      methods,
      label:
        methods.length > 1
          ? 'Mixto'
          : getPaymentMethodLabel(methods[0] ?? PaymentMethod.CASH),
      totalPaid,
    };
  }

  private getCashRefundAmount(totalAmount: number, payments: PaymentRecord[]) {
    const totalPaid = roundCurrency(
      payments.reduce((sum, payment) => sum + payment.amount, 0),
    );

    if (totalAmount <= 0 || totalPaid <= 0) {
      return 0;
    }

    const allocatedAmounts = allocateAmountByWeight(
      Math.min(totalAmount, totalPaid),
      payments.map((payment) => payment.amount),
    );

    return roundCurrency(
      allocatedAmounts.reduce((sum, amount, index) => {
        const payment = payments[index];

        if (!payment || payment.paymentMethod !== PaymentMethod.CASH) {
          return sum;
        }

        return sum + amount;
      }, 0),
    );
  }

  private mapRefundItems(items: RefundItemRecord[]) {
    return items.map((item) => ({
      id: item.id,
      saleItemId: item.saleItemId,
      productId: item.productId,
      productName: item.productNameSnapshot,
      sku: item.skuSnapshot,
      quantity: item.quantity,
      amount: item.amount,
    }));
  }

  private mapRefund(refund: RefundRecord, items: RefundItemRecord[] = []) {
    return {
      id: refund.id,
      folio: buildRefundFolio(refund.id, refund.createdAt),
      subtotal: refund.subtotal,
      taxTotal: refund.taxTotal,
      total: refund.total,
      reason: refund.reason,
      refundedBy: refund.refundedByName,
      createdAt: refund.createdAt,
      items: this.mapRefundItems(items),
    };
  }

  private buildSaleResponse(
    sale: SaleDetailRecord,
    items: SaleItemRecord[],
    payments: PaymentRecord[],
    refunds: RefundRecord[],
  ) {
    const paymentSummary = this.buildPaymentSummary(payments);
    const netTotal = roundCurrency(
      Math.max(sale.total - sale.refundedTotal, 0),
    );

    return {
      sale: {
        id: sale.id,
        folio: buildSaleFolio(sale.id, sale.createdAt),
        businessId: sale.businessId,
        businessName: sale.businessName,
        branchId: sale.branchId,
        branchName: sale.branchName,
        registerId: sale.registerId,
        registerName: sale.registerName,
        registerCode: sale.registerCode,
        cashSessionId: sale.cashSessionId,
        customer: sale.customerId
          ? {
              id: sale.customerId,
              fullName: sale.customerName,
              email: sale.customerEmail,
              phone: sale.customerPhone,
            }
          : null,
        cashier: {
          id: sale.soldBy,
          fullName: sale.soldByName,
        },
        status: sale.status,
        paymentStatus: sale.paymentStatus,
        subtotal: sale.subtotal,
        discountTotal: sale.discountTotal,
        taxTotal: sale.taxTotal,
        total: sale.total,
        refundedTotal: sale.refundedTotal,
        netTotal,
        notes: sale.notes,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
        paymentSummary,
        canCancel:
          sale.status === SaleStatus.COMPLETED &&
          sale.refundedTotal <= QUANTITY_EPSILON,
        canRefund:
          sale.status === SaleStatus.COMPLETED ||
          sale.status === SaleStatus.PARTIALLY_REFUNDED,
      },
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productNameSnapshot,
        sku: item.skuSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        baseSubtotal: roundCurrency(item.unitPrice * item.quantity),
        discountTotal: item.discountTotal,
        subtotal: item.lineTotal,
        taxTotal: item.taxTotal,
        total: roundCurrency(item.lineTotal + item.taxTotal),
        refundedQuantity: item.refundedQuantity,
        remainingQuantity: item.remainingQuantity,
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        paymentMethod: payment.paymentMethod,
        paymentMethodLabel: getPaymentMethodLabel(payment.paymentMethod),
        amount: payment.amount,
        reference: payment.reference,
        paidAt: payment.paidAt,
      })),
      refunds: refunds.map((refund) => this.mapRefund(refund)),
    };
  }

  private async loadSaleResponse(saleId: string, tx?: PrismaExecutor) {
    const sale = await this.salesRepository.getSaleDetail(saleId, tx);

    if (!sale) {
      throw new NotFoundException('La venta solicitada no existe.');
    }

    const items = await this.salesRepository.getSaleItems(saleId, tx);
    const payments = await this.salesRepository.getPayments(saleId, tx);
    const refunds = await this.salesRepository.getRefundsBySaleId(saleId, tx);

    return this.buildSaleResponse(sale, items, payments, refunds);
  }

  private buildSaleListItem(sale: SaleListRecord, payments: PaymentRecord[]) {
    const paymentSummary = this.buildPaymentSummary(payments);
    const refundedTotal = roundCurrency(sale.refundedTotal);

    return {
      id: sale.id,
      folio: buildSaleFolio(sale.id, sale.createdAt),
      status: sale.status,
      paymentStatus: sale.paymentStatus,
      customerName: sale.customerName,
      cashierName: sale.soldByName,
      subtotal: sale.subtotal,
      discountTotal: sale.discountTotal,
      taxTotal: sale.taxTotal,
      total: sale.total,
      refundedTotal: roundCurrency(refundedTotal),
      netTotal: roundCurrency(Math.max(sale.total - refundedTotal, 0)),
      paymentSummary,
      createdAt: sale.createdAt,
      canCancel:
        sale.status === SaleStatus.COMPLETED &&
        refundedTotal <= QUANTITY_EPSILON,
      canRefund:
        sale.status === SaleStatus.COMPLETED ||
        sale.status === SaleStatus.PARTIALLY_REFUNDED,
    };
  }

  async getSales(query: GetSalesDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );

    const sales = await this.salesRepository.listSales(
      query.business_id,
      query.branch_id,
      query.query,
      query.limit ?? 20,
    );
    const saleIds = sales.map((sale) => sale.id);
    const payments = await this.salesRepository.getPaymentsBySaleIds(saleIds);

    const paymentsBySaleId = new Map<string, PaymentRecord[]>();
    for (const payment of payments) {
      const currentPayments = paymentsBySaleId.get(payment.saleId) ?? [];
      currentPayments.push(payment);
      paymentsBySaleId.set(payment.saleId, currentPayments);
    }

    return sales.map((sale) =>
      this.buildSaleListItem(sale, paymentsBySaleId.get(sale.id) ?? []),
    );
  }

  async getSaleDetail(saleId: string, user: RequestUser) {
    const sale = await this.salesRepository.getSaleDetail(saleId);

    if (!sale) {
      throw new NotFoundException('La venta solicitada no existe.');
    }

    await this.assertSaleAccess(sale, user);
    return this.loadSaleResponse(saleId);
  }

  async getSaleRefunds(saleId: string, user: RequestUser) {
    const sale = await this.salesRepository.getSaleDetail(saleId);

    if (!sale) {
      throw new NotFoundException('La venta solicitada no existe.');
    }

    await this.assertSaleAccess(sale, user);
    const refunds = await this.salesRepository.getRefundsBySaleId(saleId);
    const refundItems = await this.salesRepository.getRefundItemsByRefundIds(
      refunds.map((refund) => refund.id),
    );

    const refundItemsByRefundId = new Map<string, RefundItemRecord[]>();
    for (const item of refundItems) {
      const currentItems = refundItemsByRefundId.get(item.refundId) ?? [];
      currentItems.push(item);
      refundItemsByRefundId.set(item.refundId, currentItems);
    }

    return refunds.map((refund) =>
      this.mapRefund(refund, refundItemsByRefundId.get(refund.id) ?? []),
    );
  }

  async createSale(input: CreateSaleDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      input.business_id,
      input.branch_id,
    );
    await this.registerValidationService.assertRegisterBelongsToBranch(
      input.register_id,
      input.branch_id,
      input.business_id,
    );

    const openCashSession =
      await this.cashSessionLookupService.assertOpenCashSessionById(
        input.cash_session_id,
      );

    if (
      openCashSession.registerId !== input.register_id ||
      openCashSession.businessId !== input.business_id ||
      openCashSession.branchId !== input.branch_id
    ) {
      throw new BadRequestException(
        'La caja abierta no coincide con la operacion actual.',
      );
    }

    if (
      input.payments.length > 1 &&
      input.payments.some(
        (payment) => payment.payment_method === PaymentMethod.MIXED,
      )
    ) {
      throw new BadRequestException(
        'Usa metodos reales de pago cuando registres un cobro mixto.',
      );
    }

    const uniqueProductIds = [
      ...new Set(input.items.map((item) => item.product_id)),
    ];

    if (uniqueProductIds.length !== input.items.length) {
      throw new BadRequestException(
        'No repitas el mismo producto dentro de la venta.',
      );
    }

    if (input.customer_id) {
      const customer = await this.salesRepository.getCustomerById(
        input.business_id,
        input.customer_id,
      );

      if (!customer) {
        throw new NotFoundException('El cliente seleccionado no existe.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const products = await this.salesRepository.getProductsForSale(
        input.business_id,
        uniqueProductIds,
        tx,
      );
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      if (productsById.size !== uniqueProductIds.length) {
        throw new NotFoundException(
          'Uno o mas productos no existen o ya no estan disponibles.',
        );
      }

      const location =
        await this.stockService.getDefaultInventoryLocationByBranch(
          input.business_id,
          input.branch_id,
          tx,
        );

      const provisionalItems = input.items.map((item) => {
        const product = productsById.get(item.product_id);

        if (!product) {
          throw new NotFoundException('Uno o mas productos no existen.');
        }

        const quantity = roundQuantity(item.quantity);
        const unitPrice = roundCurrency(item.unit_price ?? product.unitPrice);
        const baseSubtotal = roundCurrency(unitPrice * quantity);
        const lineDiscount = roundCurrency(item.line_discount ?? 0);

        if (lineDiscount > baseSubtotal) {
          throw new BadRequestException(
            `El descuento de ${product.name} no puede superar su importe.`,
          );
        }

        return {
          productId: product.id,
          quantity,
          unitPrice,
          baseSubtotal,
          lineDiscount,
          taxRate: product.taxRate,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          unitCostSnapshot: product.unitCost,
          trackInventory: product.trackInventory,
        };
      });

      const subtotalAfterLineDiscounts = roundCurrency(
        provisionalItems.reduce(
          (sum, item) => sum + (item.baseSubtotal - item.lineDiscount),
          0,
        ),
      );
      const saleDiscount = roundCurrency(input.sale_discount ?? 0);

      if (saleDiscount > subtotalAfterLineDiscounts) {
        throw new BadRequestException(
          'El descuento general no puede superar el subtotal de la venta.',
        );
      }

      const allocatedSaleDiscounts = allocateAmountByWeight(
        saleDiscount,
        provisionalItems.map((item) => item.baseSubtotal - item.lineDiscount),
      );

      const computedItems = provisionalItems.map((item, index) => {
        const totalDiscount = roundCurrency(
          item.lineDiscount + (allocatedSaleDiscounts[index] ?? 0),
        );
        const lineTotal = roundCurrency(item.baseSubtotal - totalDiscount);
        const taxTotal = roundCurrency(lineTotal * (item.taxRate / 100));

        return {
          ...item,
          discountTotal: totalDiscount,
          lineTotal,
          taxTotal,
        };
      });

      for (const item of computedItems) {
        if (!item.trackInventory) {
          continue;
        }

        const lockedBalance = await this.salesRepository.lockStockBalance(
          input.business_id,
          input.branch_id,
          location.id,
          item.productId,
          tx,
        );
        const availableQuantity = lockedBalance?.quantity ?? 0;

        if (availableQuantity + QUANTITY_EPSILON < item.quantity) {
          throw new BadRequestException(
            `No hay stock suficiente para ${item.productNameSnapshot}.`,
          );
        }
      }

      const subtotal = roundCurrency(
        computedItems.reduce((sum, item) => sum + item.lineTotal, 0),
      );
      const discountTotal = roundCurrency(
        computedItems.reduce((sum, item) => sum + item.discountTotal, 0),
      );
      const taxTotal = roundCurrency(
        computedItems.reduce((sum, item) => sum + item.taxTotal, 0),
      );
      const total = roundCurrency(subtotal + taxTotal);
      const paidAmount = roundCurrency(
        input.payments.reduce((sum, payment) => sum + payment.amount, 0),
      );

      if (paidAmount !== total) {
        throw new BadRequestException('Los pagos no coinciden con el total.');
      }

      const sale = await this.salesRepository.createSaleHeader(
        {
          businessId: input.business_id,
          branchId: input.branch_id,
          registerId: input.register_id,
          cashSessionId: input.cash_session_id,
          customerId: input.customer_id ?? null,
          soldBy: user.id,
          status: SaleStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          subtotal,
          discountTotal,
          taxTotal,
          total,
          notes: input.notes?.trim() || null,
        },
        tx,
      );

      for (const item of computedItems) {
        await this.salesRepository.createSaleItem(
          {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            taxTotal: item.taxTotal,
            discountTotal: item.discountTotal,
            productNameSnapshot: item.productNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            unitCostSnapshot: item.unitCostSnapshot,
          },
          tx,
        );

        if (!item.trackInventory) {
          continue;
        }

        await this.salesRepository.updateStockBalance(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: location.id,
            productId: item.productId,
            quantityDelta: -item.quantity,
          },
          tx,
        );
        await this.salesRepository.createInventoryMovement(
          {
            businessId: input.business_id,
            branchId: input.branch_id,
            locationId: location.id,
            productId: item.productId,
            movementType: InventoryMovementType.SALE_OUT,
            quantity: item.quantity,
            referenceType: 'sale',
            referenceId: sale.id,
            unitCost: item.unitCostSnapshot,
            notes: 'Salida por venta',
            actorUserId: user.id,
          },
          tx,
        );
      }

      for (const payment of input.payments) {
        await this.salesRepository.createPayment(
          {
            saleId: sale.id,
            paymentMethod: payment.payment_method,
            amount: roundCurrency(payment.amount),
            reference: payment.reference?.trim() || null,
          },
          tx,
        );
      }

      const response = await this.loadSaleResponse(sale.id, tx);

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'create_sale',
        entityType: 'sale',
        entityId: sale.id,
        afterJson: response,
        tx,
      });

      return response;
    });
  }

  async cancelSale(saleId: string, user: RequestUser) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await this.salesRepository.getSaleForUpdate(saleId, tx);

      if (!sale) {
        throw new NotFoundException('La venta solicitada no existe.');
      }

      await this.assertSaleAccess(sale, user);

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('La venta ya fue cancelada.');
      }

      if (
        sale.status === SaleStatus.REFUNDED ||
        sale.status === SaleStatus.PARTIALLY_REFUNDED
      ) {
        throw new BadRequestException(
          'La venta ya tiene devoluciones y no puede cancelarse.',
        );
      }

      if (sale.status !== SaleStatus.COMPLETED) {
        throw new BadRequestException(
          'Solo se pueden cancelar ventas completadas.',
        );
      }

      const saleItems = await this.salesRepository.getSaleItems(sale.id, tx);
      const payments = await this.salesRepository.getPayments(sale.id, tx);
      const refunds = await this.salesRepository.getRefundsBySaleId(
        sale.id,
        tx,
      );
      const returnTargets =
        await this.salesRepository.getSaleInventoryReturnTargets(sale.id, tx);

      if (refunds.length > 0) {
        throw new BadRequestException(
          'La venta ya tiene devoluciones y no puede cancelarse.',
        );
      }

      const cashRefundAmount = this.getCashRefundAmount(
        roundCurrency(
          payments.reduce((sum, payment) => sum + payment.amount, 0),
        ),
        payments,
      );

      if (cashRefundAmount > 0) {
        if (!sale.cashSessionId) {
          throw new BadRequestException(
            'La venta no tiene una sesion de caja valida para registrar la cancelacion.',
          );
        }

        await this.cashSessionLookupService.assertOpenCashSessionById(
          sale.cashSessionId,
        );
      }

      const returnTargetsByProductId = new Map(
        returnTargets.map((target) => [target.productId, target]),
      );

      for (const item of saleItems) {
        if (!item.trackInventory) {
          continue;
        }

        const returnTarget = returnTargetsByProductId.get(item.productId);

        if (!returnTarget) {
          continue;
        }

        await this.salesRepository.updateStockBalance(
          {
            businessId: sale.businessId,
            branchId: sale.branchId,
            locationId: returnTarget.locationId,
            productId: item.productId,
            quantityDelta: item.quantity,
          },
          tx,
        );
        await this.salesRepository.createInventoryMovement(
          {
            businessId: sale.businessId,
            branchId: sale.branchId,
            locationId: returnTarget.locationId,
            productId: item.productId,
            movementType: InventoryMovementType.REFUND_IN,
            quantity: item.quantity,
            referenceType: 'sale_cancel',
            referenceId: sale.id,
            unitCost: item.unitCostSnapshot,
            notes: 'Reingreso por cancelacion de venta',
            actorUserId: user.id,
          },
          tx,
        );
      }

      if (cashRefundAmount > 0 && sale.cashSessionId) {
        await this.salesRepository.createCashMovementExpense(
          {
            businessId: sale.businessId,
            branchId: sale.branchId,
            cashSessionId: sale.cashSessionId,
            amount: cashRefundAmount,
            notes: `Salida por cancelacion de ${buildSaleFolio(sale.id, sale.createdAt)}`,
            createdBy: user.id,
          },
          tx,
        );
      }

      await this.salesRepository.updateSaleStatus(
        {
          saleId: sale.id,
          status: SaleStatus.CANCELLED,
          paymentStatus:
            payments.length > 0
              ? PaymentStatus.REFUNDED
              : PaymentStatus.PENDING,
        },
        tx,
      );

      const response = await this.loadSaleResponse(sale.id, tx);

      await this.auditService.logAction({
        businessId: sale.businessId,
        actorUserId: user.id,
        action: 'cancel_sale',
        entityType: 'sale',
        entityId: sale.id,
        beforeJson: {
          status: SaleStatus.COMPLETED,
          paymentStatus: sale.paymentStatus,
        },
        afterJson: response,
        tx,
      });

      return response;
    });
  }

  async createRefund(input: CreateRefundDto, user: RequestUser) {
    const uniqueSaleItemIds = [
      ...new Set(input.items.map((item) => item.sale_item_id)),
    ];

    if (uniqueSaleItemIds.length !== input.items.length) {
      throw new BadRequestException(
        'No repitas la misma linea dentro de la devolucion.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const sale = await this.salesRepository.getSaleForUpdate(
        input.sale_id,
        tx,
      );

      if (!sale) {
        throw new NotFoundException('La venta solicitada no existe.');
      }

      await this.assertSaleAccess(sale, user);

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException(
          'No puedes devolver una venta cancelada.',
        );
      }

      if (sale.status === SaleStatus.REFUNDED) {
        throw new BadRequestException('La venta ya fue devuelta por completo.');
      }

      if (
        sale.status !== SaleStatus.COMPLETED &&
        sale.status !== SaleStatus.PARTIALLY_REFUNDED
      ) {
        throw new BadRequestException(
          'La venta no admite devoluciones en su estado actual.',
        );
      }

      const saleItems = await this.salesRepository.getSaleItems(sale.id, tx);
      const payments = await this.salesRepository.getPayments(sale.id, tx);
      const returnTargets =
        await this.salesRepository.getSaleInventoryReturnTargets(sale.id, tx);
      const saleItemsById = new Map(saleItems.map((item) => [item.id, item]));
      const returnTargetsByProductId = new Map(
        returnTargets.map((target) => [target.productId, target]),
      );

      const computedRefundItems = input.items.map((item) => {
        const saleItem = saleItemsById.get(item.sale_item_id);

        if (!saleItem) {
          throw new NotFoundException(
            'Una de las lineas seleccionadas no pertenece a la venta.',
          );
        }

        const quantity = roundQuantity(item.quantity);

        if (quantity <= 0) {
          throw new BadRequestException(
            'La cantidad a devolver debe ser mayor a cero.',
          );
        }

        if (saleItem.remainingQuantity + QUANTITY_EPSILON < quantity) {
          throw new BadRequestException(
            `La cantidad a devolver de ${saleItem.productNameSnapshot} supera lo disponible.`,
          );
        }

        const quantityRatio = quantity / saleItem.quantity;
        const subtotalAmount = roundCurrency(
          saleItem.lineTotal * quantityRatio,
        );
        const taxAmount = roundCurrency(saleItem.taxTotal * quantityRatio);
        const totalAmount = roundCurrency(subtotalAmount + taxAmount);

        return {
          saleItem,
          quantity,
          subtotalAmount,
          taxAmount,
          totalAmount,
        };
      });

      const subtotal = roundCurrency(
        computedRefundItems.reduce((sum, item) => sum + item.subtotalAmount, 0),
      );
      const taxTotal = roundCurrency(
        computedRefundItems.reduce((sum, item) => sum + item.taxAmount, 0),
      );
      const total = roundCurrency(
        computedRefundItems.reduce((sum, item) => sum + item.totalAmount, 0),
      );
      const cashRefundAmount = this.getCashRefundAmount(total, payments);

      if (cashRefundAmount > 0) {
        if (!sale.cashSessionId) {
          throw new BadRequestException(
            'La venta no tiene una sesion de caja valida para registrar la devolucion.',
          );
        }

        await this.cashSessionLookupService.assertOpenCashSessionById(
          sale.cashSessionId,
        );
      }

      const refund = await this.salesRepository.createRefund(
        {
          businessId: sale.businessId,
          branchId: sale.branchId,
          saleId: sale.id,
          refundedBy: user.id,
          subtotal,
          taxTotal,
          total,
          reason: input.reason?.trim() || null,
        },
        tx,
      );

      for (const item of computedRefundItems) {
        await this.salesRepository.createRefundItem(
          {
            refundId: refund.id,
            saleItemId: item.saleItem.id,
            quantity: item.quantity,
            amount: item.totalAmount,
          },
          tx,
        );

        if (!item.saleItem.trackInventory) {
          continue;
        }

        const returnTarget = returnTargetsByProductId.get(
          item.saleItem.productId,
        );

        if (!returnTarget) {
          continue;
        }

        await this.salesRepository.updateStockBalance(
          {
            businessId: sale.businessId,
            branchId: sale.branchId,
            locationId: returnTarget.locationId,
            productId: item.saleItem.productId,
            quantityDelta: item.quantity,
          },
          tx,
        );
        await this.salesRepository.createInventoryMovement(
          {
            businessId: sale.businessId,
            branchId: sale.branchId,
            locationId: returnTarget.locationId,
            productId: item.saleItem.productId,
            movementType: InventoryMovementType.REFUND_IN,
            quantity: item.quantity,
            referenceType: 'refund',
            referenceId: refund.id,
            unitCost: item.saleItem.unitCostSnapshot,
            notes: 'Reingreso por devolucion',
            actorUserId: user.id,
          },
          tx,
        );
      }

      if (cashRefundAmount > 0 && sale.cashSessionId) {
        await this.salesRepository.createCashMovementExpense(
          {
            businessId: sale.businessId,
            branchId: sale.branchId,
            cashSessionId: sale.cashSessionId,
            amount: cashRefundAmount,
            notes: `Salida por devolucion de ${buildSaleFolio(sale.id, sale.createdAt)}`,
            createdBy: user.id,
          },
          tx,
        );
      }

      const refreshedItems = await this.salesRepository.getSaleItems(
        sale.id,
        tx,
      );
      const fullyRefunded = refreshedItems.every(
        (item) => item.remainingQuantity <= QUANTITY_EPSILON,
      );

      await this.salesRepository.updateSaleStatus(
        {
          saleId: sale.id,
          status: fullyRefunded
            ? SaleStatus.REFUNDED
            : SaleStatus.PARTIALLY_REFUNDED,
          paymentStatus: fullyRefunded
            ? PaymentStatus.REFUNDED
            : payments.length > 0
              ? PaymentStatus.PAID
              : PaymentStatus.PENDING,
        },
        tx,
      );

      const response = await this.loadSaleResponse(sale.id, tx);
      const refundItems = await this.salesRepository.getRefundItemsByRefundIds(
        [refund.id],
        tx,
      );

      await this.auditService.logAction({
        businessId: sale.businessId,
        actorUserId: user.id,
        action: 'create_refund',
        entityType: 'refund',
        entityId: refund.id,
        afterJson: {
          refund: this.mapRefund(refund, refundItems),
          sale: response,
        },
        tx,
      });

      return {
        refund: this.mapRefund(refund, refundItems),
        sale: response,
      };
    });
  }
}
