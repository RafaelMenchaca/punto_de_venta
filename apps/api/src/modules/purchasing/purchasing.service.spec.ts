import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { StockService } from '../shared-db/stock.service';
import { PurchasingRepository } from './purchasing.repository';
import { PurchasingService } from './purchasing.service';

const logActionMock = jest.fn();
const assertBusinessMembershipMock = jest.fn().mockResolvedValue(undefined);
const assertBranchAccessMock = jest.fn().mockResolvedValue(undefined);
const assertBusinessRoleMock = jest.fn().mockResolvedValue('inventory_clerk');
const transactionMock = jest.fn((callback: (tx: object) => unknown) =>
  Promise.resolve(callback({})),
);
const getPurchaseOrderByIdForUpdateMock = jest.fn().mockResolvedValue({
  id: 'purchase-order-id',
  businessId: 'business-id',
  branchId: 'branch-id',
  supplierId: 'supplier-id',
  status: 'submitted',
});
const getPurchaseOrderItemsMock = jest.fn().mockResolvedValue([
  {
    id: 'purchase-order-item-id',
    productId: 'product-id',
    quantity: 10,
    unitCost: 15,
  },
]);
const getPurchaseOrderReceivedTotalsByProductIdsMock = jest
  .fn()
  .mockResolvedValue([
    {
      productId: 'product-id',
      receivedQuantity: 9,
    },
  ]);

const service = new PurchasingService(
  {
    logAction: logActionMock,
  } as unknown as AuditService,
  {
    assertBusinessMembership: assertBusinessMembershipMock,
    assertBranchAccess: assertBranchAccessMock,
    assertBusinessRole: assertBusinessRoleMock,
  } as unknown as BusinessAccessService,
  {
    $transaction: transactionMock,
  } as unknown as PrismaService,
  {
    getPurchaseOrderByIdForUpdate: getPurchaseOrderByIdForUpdateMock,
    getPurchaseOrderItems: getPurchaseOrderItemsMock,
    getPurchaseOrderReceivedTotalsByProductIds:
      getPurchaseOrderReceivedTotalsByProductIdsMock,
  } as unknown as PurchasingRepository,
  {} as unknown as StockService,
);

describe('PurchasingService', () => {
  const user = { id: 'user-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza recepciones que exceden lo pendiente por recibir', async () => {
    await expect(
      service.createGoodsReceipt(
        {
          business_id: 'business-id',
          branch_id: 'branch-id',
          purchase_order_id: 'purchase-order-id',
          items: [
            {
              purchase_order_item_id: 'purchase-order-item-id',
              product_id: 'product-id',
              quantity: 2,
            },
          ],
        },
        user,
      ),
    ).rejects.toThrow('La cantidad recibida excede lo pendiente.');
  });
});
