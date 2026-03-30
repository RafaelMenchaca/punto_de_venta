import { CashMovementType } from '../../common/enums/cash-movement-type.enum';
import { CashSessionStatus } from '../../common/enums/cash-session-status.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { CashSessionLookupService } from '../shared-db/cash-session.service';
import { RegisterValidationService } from '../shared-db/register-validation.service';
import { CashRepository } from './cash.repository';
import { CashSessionSummaryService } from './cash-session-summary.service';
import { CashService } from './cash.service';

const logActionMock = jest.fn().mockResolvedValue(undefined);
const assertBusinessMembershipMock = jest.fn().mockResolvedValue(undefined);
const assertBranchAccessMock = jest.fn().mockResolvedValue(undefined);
const assertBusinessRoleMock = jest.fn().mockResolvedValue('cashier');
const getOpenCashSessionByIdForUpdateMock = jest.fn();
const createCashMovementMock = jest.fn();
const closeCashSessionMock = jest.fn();
const getSummaryMock = jest.fn();
const transactionMock = jest.fn((callback: (tx: object) => Promise<unknown>) =>
  Promise.resolve(callback({})),
);

const auditService = {
  logAction: logActionMock,
} as unknown as AuditService;
const businessAccessService = {
  assertBusinessMembership: assertBusinessMembershipMock,
  assertBranchAccess: assertBranchAccessMock,
  assertBusinessRole: assertBusinessRoleMock,
} as unknown as BusinessAccessService;
const cashRepository = {
  getOpenCashSessionByIdForUpdate: getOpenCashSessionByIdForUpdateMock,
  createCashMovement: createCashMovementMock,
  closeCashSession: closeCashSessionMock,
} as unknown as CashRepository;
const cashSessionLookupService = {} as unknown as CashSessionLookupService;
const cashSessionSummaryService = {
  getSummary: getSummaryMock,
} as unknown as CashSessionSummaryService;
const prisma = {
  $transaction: transactionMock,
} as unknown as PrismaService;
const registerValidationService = {} as unknown as RegisterValidationService;
const service = new CashService(
  auditService,
  businessAccessService,
  cashRepository,
  cashSessionLookupService,
  cashSessionSummaryService,
  prisma,
  registerValidationService,
);

describe('CashService', () => {
  const user = { id: 'user-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calcula esperado y diferencia al cerrar caja', async () => {
    getOpenCashSessionByIdForUpdateMock.mockResolvedValue({
      id: 'session-id',
      businessId: 'business-id',
      branchId: 'branch-id',
    });
    getSummaryMock.mockResolvedValue({
      session: {
        businessId: 'business-id',
        branchId: 'branch-id',
      },
      totals: {
        expected_cash: 125.37,
      },
    });
    closeCashSessionMock.mockResolvedValue({
      id: 'session-id',
      businessId: 'business-id',
      status: CashSessionStatus.CLOSED,
      closedAt: new Date('2026-03-29T12:00:00Z'),
    });

    const response = await service.closeCashSession(
      {
        cash_session_id: 'session-id',
        closing_counted: 130,
        notes: 'Cierre correcto',
      },
      user,
    );

    expect(response).toEqual({
      cash_session_id: 'session-id',
      closing_expected: 125.37,
      closing_counted: 130,
      difference_amount: 4.63,
      status: CashSessionStatus.CLOSED,
      closed_at: new Date('2026-03-29T12:00:00Z'),
    });
    expect(closeCashSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cashSessionId: 'session-id',
        closedBy: 'user-id',
        closingExpected: 125.37,
        closingCounted: 130,
        differenceAmount: 4.63,
      }),
      {},
    );
    expect(logActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'close_cash_session',
        entityId: 'session-id',
      }),
    );
  });

  it('registra movimientos manuales y regresa el esperado recalculado', async () => {
    getOpenCashSessionByIdForUpdateMock.mockResolvedValue({
      id: 'session-id',
      businessId: 'business-id',
      branchId: 'branch-id',
    });
    createCashMovementMock.mockResolvedValue({
      id: 'movement-id',
      amount: 50,
      movementType: CashMovementType.INCOME,
    });
    getSummaryMock.mockResolvedValue({
      totals: {
        expected_cash: 215,
      },
    });

    const response = await service.createCashMovement(
      'session-id',
      {
        movement_type: CashMovementType.INCOME,
        amount: 50,
        notes: 'Ingreso manual',
      },
      user,
    );

    expect(response).toEqual({
      movement: {
        id: 'movement-id',
        amount: 50,
        movementType: CashMovementType.INCOME,
      },
      expected_cash: 215,
    });
    expect(assertBusinessRoleMock).toHaveBeenCalledWith(
      'user-id',
      'business-id',
      expect.arrayContaining(['owner', 'admin', 'manager', 'cashier']),
      'branch-id',
      'No tienes permiso para operar caja.',
    );
  });
});
