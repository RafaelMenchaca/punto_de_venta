import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { StockService } from '../shared-db/stock.service';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

const logActionMock = jest.fn();
const assertBusinessMembershipMock = jest.fn().mockResolvedValue(undefined);
const assertBranchAccessMock = jest.fn().mockResolvedValue(undefined);
const assertBusinessRoleMock = jest.fn().mockResolvedValue('inventory_clerk');
const transactionMock = jest.fn((callback: (tx: object) => unknown) =>
  Promise.resolve(callback({})),
);
const getProductByIdMock = jest.fn().mockResolvedValue({
  id: 'product-id',
  name: 'Cafe americano',
  costPrice: 5,
  trackInventory: true,
});
const getLocationByIdMock = jest
  .fn()
  .mockResolvedValueOnce({
    id: 'from-location-id',
    name: 'Mostrador',
    isActive: true,
  })
  .mockResolvedValueOnce({
    id: 'to-location-id',
    name: 'Bodega',
    isActive: true,
  });
const lockStockBalanceMock = jest
  .fn()
  .mockResolvedValueOnce({
    quantity: 1,
    reservedQuantity: 0,
  })
  .mockResolvedValueOnce(null);
const updateStockBalanceMock = jest.fn();
const insertStockBalanceMock = jest.fn();
const createInventoryMovementMock = jest.fn();

const service = new InventoryService(
  {
    logAction: logActionMock,
  } as unknown as AuditService,
  {
    assertBusinessMembership: assertBusinessMembershipMock,
    assertBranchAccess: assertBranchAccessMock,
    assertBusinessRole: assertBusinessRoleMock,
  } as unknown as BusinessAccessService,
  {
    getProductById: getProductByIdMock,
    getLocationById: getLocationByIdMock,
    lockStockBalance: lockStockBalanceMock,
    updateStockBalance: updateStockBalanceMock,
    insertStockBalance: insertStockBalanceMock,
    createInventoryMovement: createInventoryMovementMock,
  } as unknown as InventoryRepository,
  {
    $transaction: transactionMock,
  } as unknown as PrismaService,
  {} as unknown as StockService,
);

describe('InventoryService', () => {
  const user = { id: 'user-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza transferencias entre la misma ubicacion', async () => {
    await expect(
      service.createTransfer(
        {
          business_id: 'business-id',
          branch_id: 'branch-id',
          product_id: 'product-id',
          from_location_id: 'same-location-id',
          to_location_id: 'same-location-id',
          quantity: 1,
        },
        user,
      ),
    ).rejects.toThrow(
      'Selecciona ubicaciones distintas para transferir stock.',
    );
  });

  it('rechaza transferencias cuando el origen no tiene disponible suficiente', async () => {
    await expect(
      service.createTransfer(
        {
          business_id: 'business-id',
          branch_id: 'branch-id',
          product_id: 'product-id',
          from_location_id: 'from-location-id',
          to_location_id: 'to-location-id',
          quantity: 2,
        },
        user,
      ),
    ).rejects.toThrow('No hay stock suficiente en la ubicacion origen.');
  });
});
