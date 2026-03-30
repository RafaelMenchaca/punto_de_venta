import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { SaleStatus } from '../../common/enums/sale-status.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { CashSessionLookupService } from '../shared-db/cash-session.service';
import { RegisterValidationService } from '../shared-db/register-validation.service';
import { StockService } from '../shared-db/stock.service';
import { SalesRepository } from './sales.repository';
import { SalesService } from './sales.service';

const transactionMock = jest.fn((callback: (tx: object) => unknown) =>
  Promise.resolve(callback({})),
);
const logActionMock = jest.fn();
const assertBusinessMembershipMock = jest.fn().mockResolvedValue(undefined);
const assertBranchAccessMock = jest.fn().mockResolvedValue(undefined);
const assertBusinessRoleMock = jest.fn().mockResolvedValue('cashier');
const assertOpenCashSessionByIdMock = jest.fn().mockResolvedValue({
  id: 'session-id',
  registerId: 'register-id',
  businessId: 'business-id',
  branchId: 'branch-id',
});
const assertRegisterBelongsToBranchMock = jest
  .fn()
  .mockResolvedValue(undefined);
const getProductsForSaleMock = jest.fn().mockResolvedValue([
  {
    id: 'product-id',
    name: 'Cafe americano',
    sku: 'CAFE-001',
    unitPrice: 10,
    unitCost: 4,
    taxRate: 0,
    trackInventory: false,
  },
]);
const lockStockBalanceMock = jest.fn();
const createSaleHeaderMock = jest.fn();
const createSaleItemMock = jest.fn();
const updateStockBalanceMock = jest.fn();
const createInventoryMovementMock = jest.fn();
const createPaymentMock = jest.fn();
const getCustomerByIdMock = jest.fn();
const getSaleForUpdateMock = jest.fn();
const getSaleDetailMock = jest.fn();
const getSaleItemsMock = jest.fn();
const getPaymentsMock = jest.fn();
const getRefundsBySaleIdMock = jest.fn();
const getSaleInventoryReturnTargetsMock = jest.fn();
const updateSaleStatusMock = jest.fn();
const getDefaultInventoryLocationByBranchMock = jest.fn().mockResolvedValue({
  id: 'location-id',
});

const service = new SalesService(
  {
    logAction: logActionMock,
  } as unknown as AuditService,
  {
    assertBusinessMembership: assertBusinessMembershipMock,
    assertBranchAccess: assertBranchAccessMock,
    assertBusinessRole: assertBusinessRoleMock,
  } as unknown as BusinessAccessService,
  {
    assertOpenCashSessionById: assertOpenCashSessionByIdMock,
  } as unknown as CashSessionLookupService,
  {
    $transaction: transactionMock,
  } as unknown as PrismaService,
  {
    assertRegisterBelongsToBranch: assertRegisterBelongsToBranchMock,
  } as unknown as RegisterValidationService,
  {
    getProductsForSale: getProductsForSaleMock,
    lockStockBalance: lockStockBalanceMock,
    createSaleHeader: createSaleHeaderMock,
    createSaleItem: createSaleItemMock,
    updateStockBalance: updateStockBalanceMock,
    createInventoryMovement: createInventoryMovementMock,
    createPayment: createPaymentMock,
    getCustomerById: getCustomerByIdMock,
    getSaleForUpdate: getSaleForUpdateMock,
    getSaleDetail: getSaleDetailMock,
    getSaleItems: getSaleItemsMock,
    getPayments: getPaymentsMock,
    getRefundsBySaleId: getRefundsBySaleIdMock,
    getSaleInventoryReturnTargets: getSaleInventoryReturnTargetsMock,
    updateSaleStatus: updateSaleStatusMock,
  } as unknown as SalesRepository,
  {
    getDefaultInventoryLocationByBranch:
      getDefaultInventoryLocationByBranchMock,
  } as unknown as StockService,
);

describe('SalesService', () => {
  const user = { id: 'user-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza ventas cuando los pagos no coinciden con el total', async () => {
    await expect(
      service.createSale(
        {
          business_id: 'business-id',
          branch_id: 'branch-id',
          register_id: 'register-id',
          cash_session_id: 'session-id',
          items: [
            {
              product_id: 'product-id',
              quantity: 1,
              unit_price: 10,
            },
          ],
          payments: [
            {
              payment_method: PaymentMethod.CASH,
              amount: 9,
            },
          ],
        },
        user,
      ),
    ).rejects.toThrow('Los pagos no coinciden con el total.');

    expect(createSaleHeaderMock).not.toHaveBeenCalled();
  });

  it('rechaza devoluciones que exceden lo vendido disponible', async () => {
    getSaleForUpdateMock.mockResolvedValue({
      id: 'sale-id',
      businessId: 'business-id',
      branchId: 'branch-id',
      status: SaleStatus.COMPLETED,
    });
    getSaleItemsMock.mockResolvedValue([
      {
        id: 'sale-item-id',
        productId: 'product-id',
        productNameSnapshot: 'Cafe americano',
        quantity: 1,
        remainingQuantity: 0.5,
      },
    ]);
    getPaymentsMock.mockResolvedValue([]);
    getSaleInventoryReturnTargetsMock.mockResolvedValue([]);

    await expect(
      service.createRefund(
        {
          sale_id: 'sale-id',
          items: [
            {
              sale_item_id: 'sale-item-id',
              quantity: 1,
            },
          ],
        },
        user,
      ),
    ).rejects.toThrow(
      'La cantidad a devolver de Cafe americano supera lo disponible.',
    );
  });
});
