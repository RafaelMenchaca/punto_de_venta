import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { CashSessionLookupService } from '../shared-db/cash-session.service';
import { RegisterValidationService } from '../shared-db/register-validation.service';
import { StockService } from '../shared-db/stock.service';
import type { CreateSaleDto } from './dto/create-sale.dto';
import {
  type PaymentRecord,
  SalesRepository,
  type SaleItemRecord,
} from './sales.repository';

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

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

    if (openCashSession.registerId !== input.register_id) {
      throw new BadRequestException(
        'La sesión de caja no coincide con la caja de la venta.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const uniqueProductIds = [
        ...new Set(input.items.map((item) => item.product_id)),
      ];
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
          'Uno o más productos no existen o no pertenecen al negocio.',
        );
      }

      const location =
        await this.stockService.getDefaultInventoryLocationByBranch(
          input.business_id,
          input.branch_id,
          tx,
        );

      const computedItems: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        taxTotal: number;
        productNameSnapshot: string;
        skuSnapshot: string | null;
        unitCostSnapshot: number;
        trackInventory: boolean;
      }> = [];

      for (const item of input.items) {
        const product = productsById.get(item.product_id);

        if (!product) {
          throw new NotFoundException(
            `Producto ${item.product_id} no encontrado.`,
          );
        }

        const unitPrice = roundCurrency(item.unit_price ?? product.unitPrice);
        const lineTotal = roundCurrency(unitPrice * item.quantity);
        const taxTotal = roundCurrency(lineTotal * (product.taxRate / 100));

        if (product.trackInventory) {
          const lockedBalance = await this.salesRepository.lockStockBalance(
            input.business_id,
            input.branch_id,
            location.id,
            product.id,
            tx,
          );
          const availableQuantity = lockedBalance?.quantity ?? 0;

          if (availableQuantity < item.quantity) {
            throw new BadRequestException(
              `Stock insuficiente para ${product.name}. Disponible: ${availableQuantity}.`,
            );
          }
        }

        computedItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          taxTotal,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          unitCostSnapshot: product.unitCost,
          trackInventory: product.trackInventory,
        });
      }

      const subtotal = roundCurrency(
        computedItems.reduce((sum, item) => sum + item.lineTotal, 0),
      );
      const taxTotal = roundCurrency(
        computedItems.reduce((sum, item) => sum + item.taxTotal, 0),
      );
      const total = roundCurrency(subtotal + taxTotal);
      const paidAmount = roundCurrency(
        input.payments.reduce((sum, payment) => sum + payment.amount, 0),
      );

      if (paidAmount !== total) {
        throw new BadRequestException(
          'La suma de los pagos debe coincidir exactamente con el total de la venta.',
        );
      }

      const sale = await this.salesRepository.createSaleHeader(
        {
          businessId: input.business_id,
          branchId: input.branch_id,
          registerId: input.register_id,
          cashSessionId: input.cash_session_id,
          customerId: input.customer_id ?? null,
          soldBy: user.id,
          status: 'completed',
          paymentStatus: 'paid',
          subtotal,
          discountTotal: 0,
          taxTotal,
          total,
          notes: input.notes ?? null,
        },
        tx,
      );

      const saleItems: SaleItemRecord[] = [];
      for (const item of computedItems) {
        const savedItem = await this.salesRepository.createSaleItem(
          {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            taxTotal: item.taxTotal,
            productNameSnapshot: item.productNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            unitCostSnapshot: item.unitCostSnapshot,
          },
          tx,
        );
        saleItems.push(savedItem);

        if (item.trackInventory) {
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
              quantity: item.quantity,
              referenceId: sale.id,
              unitCost: item.unitCostSnapshot,
              actorUserId: user.id,
            },
            tx,
          );
        }
      }

      const payments: PaymentRecord[] = [];
      for (const payment of input.payments) {
        const savedPayment = await this.salesRepository.createPayment(
          {
            saleId: sale.id,
            paymentMethod: payment.payment_method,
            amount: payment.amount,
            reference: payment.reference ?? null,
          },
          tx,
        );
        payments.push(savedPayment);
      }

      await this.auditService.logAction({
        businessId: input.business_id,
        actorUserId: user.id,
        action: 'create_sale',
        entityType: 'sale',
        entityId: sale.id,
        afterJson: {
          sale,
          saleItems,
          payments,
        },
        tx,
      });

      return {
        sale,
        items: saleItems,
        payments,
        inventory_location: location,
      };
    });
  }
}
