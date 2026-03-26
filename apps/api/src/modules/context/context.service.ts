import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import { CashSessionLookupService } from '../shared-db/cash-session.service';
import type { GetContextBranchesDto } from './dto/get-context-branches.dto';
import type { GetContextRegistersDto } from './dto/get-context-registers.dto';
import type { GetOperatingContextDto } from './dto/get-operating-context.dto';

interface UserProfileRecord {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
}

interface BusinessOption {
  id: string;
  name: string;
  slug: string;
}

interface BranchOption {
  id: string;
  name: string;
  code: string | null;
}

interface RegisterOption {
  id: string;
  name: string;
  code: string;
}

@Injectable()
export class ContextService {
  constructor(
    private readonly businessAccessService: BusinessAccessService,
    private readonly cashSessionLookupService: CashSessionLookupService,
    private readonly prisma: PrismaService,
  ) {}

  private async getUserProfile(
    userId: string,
    businessId?: string | null,
    branchId?: string | null,
  ) {
    const rows = await this.prisma.$queryRaw<UserProfileRecord[]>(
      Prisma.sql`
        SELECT
          p.id,
          p.full_name AS "fullName",
          p.email,
          ${
            businessId
              ? Prisma.sql`
                  (
                    SELECT ubr.role::text
                    FROM user_business_roles ubr
                    WHERE ubr.user_id = p.id
                      AND ubr.business_id = CAST(${businessId} AS uuid)
                      AND ubr.is_active = true
                      ${
                        branchId
                          ? Prisma.sql`
                              AND (
                                ubr.branch_id = CAST(${branchId} AS uuid)
                                OR ubr.branch_id IS NULL
                              )
                              ORDER BY CASE
                                WHEN ubr.branch_id = CAST(${branchId} AS uuid) THEN 0
                                ELSE 1
                              END
                            `
                          : Prisma.sql`
                              ORDER BY CASE
                                WHEN ubr.branch_id IS NULL THEN 1
                                ELSE 0
                              END
                            `
                      }
                    LIMIT 1
                  ) AS role
                `
              : Prisma.sql`NULL::text AS role`
          }
        FROM profiles p
        WHERE p.id = CAST(${userId} AS uuid)
        LIMIT 1
      `,
    );

    const profile = rows[0];

    if (!profile) {
      throw new NotFoundException(
        'No fue posible resolver el perfil del usuario autenticado.',
      );
    }

    return {
      id: profile.id,
      full_name: profile.fullName,
      email: profile.email,
      role: profile.role,
    };
  }

  private resolveSelectedOption<T extends { id: string }>(
    items: T[],
    selectedId?: string | null,
  ) {
    if (!selectedId) {
      return items.length === 1 ? items[0]! : null;
    }

    const item = items.find((candidate) => candidate.id === selectedId);

    if (!item) {
      throw new BadRequestException(
        'La seleccion operativa enviada no es valida para el usuario actual.',
      );
    }

    return item;
  }

  async getBusinesses(user: RequestUser) {
    return this.businessAccessService.getAccessibleBusinesses(user.id);
  }

  async getBranches(query: GetContextBranchesDto, user: RequestUser) {
    return this.businessAccessService.getAccessibleBranches(
      user.id,
      query.business_id,
    );
  }

  async getRegisters(query: GetContextRegistersDto, user: RequestUser) {
    return this.businessAccessService.getAccessibleRegisters(
      user.id,
      query.business_id,
      query.branch_id,
    );
  }

  async getOperatingContext(query: GetOperatingContextDto, user: RequestUser) {
    if (query.branch_id && !query.business_id) {
      throw new BadRequestException(
        'No puedes resolver una sucursal sin enviar business_id.',
      );
    }

    if (query.register_id && (!query.business_id || !query.branch_id)) {
      throw new BadRequestException(
        'No puedes resolver una caja sin enviar business_id y branch_id.',
      );
    }

    const businesses = await this.businessAccessService.getAccessibleBusinesses(
      user.id,
    );
    const selectedBusiness = this.resolveSelectedOption(
      businesses,
      query.business_id ?? null,
    );

    const branches = selectedBusiness
      ? await this.businessAccessService.getAccessibleBranches(
          user.id,
          selectedBusiness.id,
        )
      : [];
    const selectedBranch = selectedBusiness
      ? this.resolveSelectedOption(branches, query.branch_id ?? null)
      : null;

    const registers =
      selectedBusiness && selectedBranch
        ? await this.businessAccessService.getAccessibleRegisters(
            user.id,
            selectedBusiness.id,
            selectedBranch.id,
          )
        : [];
    const selectedRegister =
      selectedBusiness && selectedBranch
        ? this.resolveSelectedOption(registers, query.register_id ?? null)
        : null;

    const profile = await this.getUserProfile(
      user.id,
      selectedBusiness?.id ?? null,
      selectedBranch?.id ?? null,
    );
    const openCashSession = selectedRegister
      ? await this.cashSessionLookupService.getOpenCashSessionByRegister(
          selectedRegister.id,
        )
      : null;

    return {
      user: profile,
      businesses: businesses.map((business: BusinessOption) => ({
        id: business.id,
        name: business.name,
        slug: business.slug,
      })),
      branches: branches.map((branch: BranchOption) => ({
        id: branch.id,
        name: branch.name,
        code: branch.code,
      })),
      registers: registers.map((register: RegisterOption) => ({
        id: register.id,
        name: register.name,
        code: register.code,
      })),
      selection: {
        business_id: selectedBusiness?.id ?? null,
        branch_id: selectedBranch?.id ?? null,
        register_id: selectedRegister?.id ?? null,
      },
      business: selectedBusiness
        ? {
            id: selectedBusiness.id,
            name: selectedBusiness.name,
          }
        : null,
      branch: selectedBranch
        ? {
            id: selectedBranch.id,
            name: selectedBranch.name,
          }
        : null,
      register: selectedRegister
        ? {
            id: selectedRegister.id,
            name: selectedRegister.name,
            code: selectedRegister.code,
          }
        : null,
      open_cash_session: openCashSession,
    };
  }
}
