import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CashMovementType } from '../../common/enums/cash-movement-type.enum';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { CashSessionLookupService } from '../shared-db/cash-session.service';
import { RegisterValidationService } from '../shared-db/register-validation.service';
import { CashRepository } from './cash.repository';
import { CashSessionSummaryService } from './cash-session-summary.service';
import type { CloseCashSessionDto } from './dto/close-cash-session.dto';
import type { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import type { GetOpenCashSessionDto } from './dto/get-open-cash-session.dto';
import type { OpenCashSessionDto } from './dto/open-cash-session.dto';

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable()
export class CashService {
  constructor(
    private readonly auditService: AuditService,
    private readonly businessAccessService: BusinessAccessService,
    private readonly cashRepository: CashRepository,
    private readonly cashSessionLookupService: CashSessionLookupService,
    private readonly cashSessionSummaryService: CashSessionSummaryService,
    private readonly prisma: PrismaService,
    private readonly registerValidationService: RegisterValidationService,
  ) {}

  async getOpenCashSessionByRegister(
    registerId: string,
    query: GetOpenCashSessionDto,
    user: RequestUser,
  ) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      query.business_id,
      query.branch_id,
    );
    await this.registerValidationService.assertRegisterBelongsToBranch(
      registerId,
      query.branch_id,
      query.business_id,
    );

    return this.cashSessionLookupService.getOpenCashSessionByRegister(
      registerId,
    );
  }

  async openCashSession(input: OpenCashSessionDto, user: RequestUser) {
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

    const currentOpenSession =
      await this.cashSessionLookupService.getOpenCashSessionByRegister(
        input.register_id,
      );

    if (currentOpenSession) {
      throw new ConflictException(
        'La caja seleccionada ya tiene una sesion abierta.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const session = await this.cashRepository.createCashSession(
        {
          businessId: input.business_id,
          branchId: input.branch_id,
          registerId: input.register_id,
          openingAmount: input.opening_amount,
          openedBy: user.id,
          notes: input.notes ?? null,
        },
        tx,
      );

      await this.auditService.logAction({
        businessId: session.businessId,
        actorUserId: user.id,
        action: 'open_cash_session',
        entityType: 'cash_session',
        entityId: session.id,
        afterJson: session,
        tx,
      });

      return session;
    });
  }

  async createCashMovement(
    cashSessionId: string,
    input: CreateCashMovementDto,
    user: RequestUser,
  ) {
    if (input.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero.');
    }

    return this.prisma.$transaction(async (tx) => {
      const openSession =
        await this.cashRepository.getOpenCashSessionByIdForUpdate(
          cashSessionId,
          tx,
        );

      if (!openSession) {
        throw new NotFoundException(
          'La sesion de caja abierta no existe o ya fue cerrada.',
        );
      }

      await this.businessAccessService.assertBusinessMembership(
        user.id,
        openSession.businessId,
      );
      await this.businessAccessService.assertBranchAccess(
        user.id,
        openSession.businessId,
        openSession.branchId,
      );

      const movement = await this.cashRepository.createCashMovement(
        {
          businessId: openSession.businessId,
          branchId: openSession.branchId,
          cashSessionId,
          movementType: input.movement_type,
          amount: input.amount,
          notes: input.notes ?? null,
          createdBy: user.id,
        },
        tx,
      );

      await this.auditService.logAction({
        businessId: openSession.businessId,
        actorUserId: user.id,
        action:
          input.movement_type === CashMovementType.INCOME
            ? 'cash_income'
            : 'cash_expense',
        entityType: 'cash_movement',
        entityId: movement.id,
        afterJson: movement,
        tx,
      });

      const summary = await this.cashSessionSummaryService.getSummary(
        cashSessionId,
        tx,
      );

      return {
        movement,
        expected_cash: summary.totals.expected_cash,
      };
    });
  }

  async getCashSessionSummary(cashSessionId: string, user: RequestUser) {
    const summary =
      await this.cashSessionSummaryService.getSummary(cashSessionId);

    await this.businessAccessService.assertBusinessMembership(
      user.id,
      summary.session.businessId,
    );
    await this.businessAccessService.assertBranchAccess(
      user.id,
      summary.session.businessId,
      summary.session.branchId,
    );

    return summary;
  }

  async closeCashSession(input: CloseCashSessionDto, user: RequestUser) {
    if (input.closing_counted < 0) {
      throw new BadRequestException(
        'El conteo de cierre no puede ser negativo.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const openSession =
        await this.cashRepository.getOpenCashSessionByIdForUpdate(
          input.cash_session_id,
          tx,
        );

      if (!openSession) {
        throw new NotFoundException(
          'La sesion de caja abierta no existe o ya fue cerrada.',
        );
      }

      await this.businessAccessService.assertBusinessMembership(
        user.id,
        openSession.businessId,
      );
      await this.businessAccessService.assertBranchAccess(
        user.id,
        openSession.businessId,
        openSession.branchId,
      );

      const summaryBeforeClose =
        await this.cashSessionSummaryService.getSummary(
          input.cash_session_id,
          tx,
        );
      const closingExpected = roundCurrency(
        summaryBeforeClose.totals.expected_cash,
      );
      const differenceAmount = roundCurrency(
        input.closing_counted - closingExpected,
      );

      const closedSession = await this.cashRepository.closeCashSession(
        {
          cashSessionId: input.cash_session_id,
          closedBy: user.id,
          closingExpected,
          closingCounted: input.closing_counted,
          differenceAmount,
          notes: input.notes ?? null,
        },
        tx,
      );

      const response = {
        cash_session_id: closedSession.id,
        closing_expected: closingExpected,
        closing_counted: input.closing_counted,
        difference_amount: differenceAmount,
        status: closedSession.status,
        closed_at: closedSession.closedAt,
      };

      await this.auditService.logAction({
        businessId: closedSession.businessId,
        actorUserId: user.id,
        action: 'close_cash_session',
        entityType: 'cash_session',
        entityId: closedSession.id,
        beforeJson: summaryBeforeClose,
        afterJson: response,
        tx,
      });

      return response;
    });
  }
}
