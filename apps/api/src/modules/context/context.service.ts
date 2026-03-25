import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { CashSessionLookupService } from '../shared-db/cash-session.service';
import { RegisterValidationService } from '../shared-db/register-validation.service';
import type { GetOperatingContextDto } from './dto/get-operating-context.dto';

interface OperatingContextRecord {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  role: string | null;
  businessId: string;
  businessName: string;
  branchId: string;
  branchName: string;
  registerId: string | null;
  registerName: string | null;
  registerCode: string | null;
}

@Injectable()
export class ContextService {
  constructor(
    private readonly businessAccessService: BusinessAccessService,
    private readonly cashSessionLookupService: CashSessionLookupService,
    private readonly prisma: PrismaService,
    private readonly registerValidationService: RegisterValidationService,
  ) {}

  async getOperatingContext(query: GetOperatingContextDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBranchBelongsToBusiness(
      query.branch_id,
      query.business_id,
    );

    if (query.register_id) {
      await this.registerValidationService.assertRegisterBelongsToBranch(
        query.register_id,
        query.branch_id,
        query.business_id,
      );
    }

    const rows = await this.prisma.$queryRaw<OperatingContextRecord[]>(
      Prisma.sql`
        SELECT
          p.id AS "userId",
          p.full_name AS "userName",
          p.email AS "userEmail",
          ubr.role::text AS role,
          b.id AS "businessId",
          b.name AS "businessName",
          br.id AS "branchId",
          br.name AS "branchName",
          r.id AS "registerId",
          r.name AS "registerName",
          r.code AS "registerCode"
        FROM profiles p
        INNER JOIN businesses b
          ON b.id = CAST(${query.business_id} AS uuid)
        INNER JOIN branches br
          ON br.id = CAST(${query.branch_id} AS uuid)
         AND br.business_id = b.id
        LEFT JOIN registers r
          ON r.id = CAST(${query.register_id ?? null} AS uuid)
         AND r.branch_id = br.id
         AND r.business_id = b.id
        LEFT JOIN user_business_roles ubr
          ON ubr.user_id = p.id
         AND ubr.business_id = b.id
         AND (ubr.branch_id = br.id OR ubr.branch_id IS NULL)
         AND ubr.is_active = true
        WHERE p.id = CAST(${user.id} AS uuid)
        ORDER BY CASE WHEN ubr.branch_id = br.id THEN 0 ELSE 1 END
        LIMIT 1
      `,
    );

    const context = rows[0];

    if (!context) {
      throw new NotFoundException(
        'No fue posible resolver el contexto operativo actual.',
      );
    }

    const openCashSession = query.register_id
      ? await this.cashSessionLookupService.getOpenCashSessionByRegister(
          query.register_id,
        )
      : null;

    return {
      user: {
        id: context.userId,
        full_name: context.userName,
        email: context.userEmail,
        role: context.role,
      },
      business: {
        id: context.businessId,
        name: context.businessName,
      },
      branch: {
        id: context.branchId,
        name: context.branchName,
      },
      register: context.registerId
        ? {
            id: context.registerId,
            name: context.registerName,
            code: context.registerCode,
          }
        : null,
      open_cash_session: openCashSession,
    };
  }
}
