import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { CashSessionLookupService } from '../shared-db/cash-session.service';
import { RegisterValidationService } from '../shared-db/register-validation.service';
import { CashRepository } from './cash.repository';
import type { CloseCashSessionDto } from './dto/close-cash-session.dto';
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
    await this.businessAccessService.assertBranchBelongsToBusiness(
      query.branch_id,
      query.business_id,
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
    await this.businessAccessService.assertBranchBelongsToBusiness(
      input.branch_id,
      input.business_id,
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
        'La caja seleccionada ya tiene una sesión abierta.',
      );
    }

    const session = await this.cashRepository.createCashSession({
      businessId: input.business_id,
      branchId: input.branch_id,
      registerId: input.register_id,
      openingAmount: input.opening_amount,
      openedBy: user.id,
      notes: input.notes ?? null,
    });

    await this.auditService.logAction({
      businessId: session.businessId,
      actorUserId: user.id,
      action: 'open_cash_session',
      entityType: 'cash_session',
      entityId: session.id,
      afterJson: session,
    });

    return session;
  }

  async closeCashSession(input: CloseCashSessionDto, user: RequestUser) {
    if (input.closing_counted < 0) {
      throw new BadRequestException(
        'El conteo de cierre no puede ser negativo.',
      );
    }

    const openSession =
      await this.cashSessionLookupService.assertOpenCashSessionById(
        input.cash_session_id,
      );

    await this.businessAccessService.assertBusinessMembership(
      user.id,
      openSession.businessId,
    );

    const totals = await this.cashRepository.calculateCloseTotals(
      input.cash_session_id,
    );
    const closingExpected = roundCurrency(
      totals.openingAmount + totals.cashMovementNet + totals.cashSalesTotal,
    );
    const differenceAmount = roundCurrency(
      input.closing_counted - closingExpected,
    );

    const closedSession = await this.cashRepository.closeCashSession({
      cashSessionId: input.cash_session_id,
      closedBy: user.id,
      closingExpected,
      closingCounted: input.closing_counted,
      differenceAmount,
      notes: input.notes ?? null,
    });

    const summary = {
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
      beforeJson: openSession,
      afterJson: summary,
    });

    return summary;
  }
}
