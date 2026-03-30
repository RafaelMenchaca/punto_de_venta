import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface BusinessOption {
  id: string;
  name: string;
  slug: string;
}

export interface BranchOption {
  id: string;
  name: string;
  code: string | null;
}

export interface RegisterOption {
  id: string;
  name: string;
  code: string;
}

@Injectable()
export class BusinessAccessService {
  constructor(private readonly prisma: PrismaService) {}

  private buildRolePrioritySql(columnName: string) {
    return Prisma.sql`
      CASE ${Prisma.raw(columnName)}
        WHEN 'owner' THEN 0
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'cashier' THEN 3
        WHEN 'inventory_clerk' THEN 4
        ELSE 5
      END
    `;
  }

  async getEffectiveRole(
    userId: string,
    businessId: string,
    branchId?: string | null,
  ) {
    const rows = await this.prisma.$queryRaw<Array<{ role: UserRole }>>(
      Prisma.sql`
        SELECT ubr.role::text AS role
        FROM user_business_roles ubr
        WHERE ubr.user_id = CAST(${userId} AS uuid)
          AND ubr.business_id = CAST(${businessId} AS uuid)
          AND ubr.is_active = true
          ${
            branchId
              ? Prisma.sql`
                  AND (
                    ubr.branch_id = CAST(${branchId} AS uuid)
                    OR ubr.branch_id IS NULL
                  )
                `
              : Prisma.empty
          }
        ORDER BY
          ${
            branchId
              ? Prisma.sql`
                  CASE
                    WHEN ubr.branch_id = CAST(${branchId} AS uuid) THEN 0
                    WHEN ubr.branch_id IS NULL THEN 1
                    ELSE 2
                  END,
                `
              : Prisma.empty
          }
          ${this.buildRolePrioritySql('ubr.role')}
        LIMIT 1
      `,
    );

    return rows[0]?.role ?? null;
  }

  async assertBusinessRole(
    userId: string,
    businessId: string,
    allowedRoles: readonly UserRole[],
    branchId?: string | null,
    message = 'No tienes permiso para realizar esta accion.',
  ) {
    if (allowedRoles.length === 0) {
      throw new ForbiddenException(message);
    }

    const effectiveRole = await this.getEffectiveRole(
      userId,
      businessId,
      branchId,
    );

    if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
      throw new ForbiddenException(message);
    }

    return effectiveRole;
  }

  async assertBusinessMembership(userId: string, businessId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ businessId: string }>>(
      Prisma.sql`
        SELECT ubr.business_id AS "businessId"
        FROM user_business_roles ubr
        INNER JOIN businesses b ON b.id = ubr.business_id
        WHERE ubr.user_id = CAST(${userId} AS uuid)
          AND ubr.business_id = CAST(${businessId} AS uuid)
          AND ubr.is_active = true
          AND b.is_active = true
        LIMIT 1
      `,
    );

    if (rows.length === 0) {
      throw new ForbiddenException(
        'El usuario autenticado no pertenece al negocio solicitado.',
      );
    }
  }

  async assertBranchBelongsToBusiness(branchId: string, businessId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM branches
        WHERE id = CAST(${branchId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
          AND is_active = true
        LIMIT 1
      `,
    );

    if (rows.length === 0) {
      throw new NotFoundException(
        'La sucursal no pertenece al negocio solicitado.',
      );
    }
  }

  async assertBranchAccess(
    userId: string,
    businessId: string,
    branchId: string,
  ) {
    await this.assertBusinessMembership(userId, businessId);
    await this.assertBranchBelongsToBusiness(branchId, businessId);

    const unrestrictedRows = await this.prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT ubr.id
        FROM user_business_roles ubr
        WHERE ubr.user_id = CAST(${userId} AS uuid)
          AND ubr.business_id = CAST(${businessId} AS uuid)
          AND ubr.is_active = true
          AND ubr.branch_id IS NULL
        LIMIT 1
      `,
    );

    if (unrestrictedRows.length > 0) {
      return;
    }

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT ubr.id
        FROM user_business_roles ubr
        WHERE ubr.user_id = CAST(${userId} AS uuid)
          AND ubr.business_id = CAST(${businessId} AS uuid)
          AND ubr.branch_id = CAST(${branchId} AS uuid)
          AND ubr.is_active = true
        LIMIT 1
      `,
    );

    if (rows.length === 0) {
      throw new ForbiddenException(
        'El usuario autenticado no tiene acceso a la sucursal solicitada.',
      );
    }
  }

  async getAccessibleBusinesses(userId: string) {
    return this.prisma.$queryRaw<BusinessOption[]>(
      Prisma.sql`
        SELECT DISTINCT
          b.id,
          b.name,
          b.slug
        FROM user_business_roles ubr
        INNER JOIN businesses b ON b.id = ubr.business_id
        WHERE ubr.user_id = CAST(${userId} AS uuid)
          AND ubr.is_active = true
          AND b.is_active = true
        ORDER BY b.name
      `,
    );
  }

  async getAccessibleBranches(userId: string, businessId: string) {
    await this.assertBusinessMembership(userId, businessId);

    const unrestrictedRows = await this.prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT ubr.id
        FROM user_business_roles ubr
        WHERE ubr.user_id = CAST(${userId} AS uuid)
          AND ubr.business_id = CAST(${businessId} AS uuid)
          AND ubr.is_active = true
          AND ubr.branch_id IS NULL
        LIMIT 1
      `,
    );

    if (unrestrictedRows.length > 0) {
      return this.prisma.$queryRaw<BranchOption[]>(
        Prisma.sql`
          SELECT
            br.id,
            br.name,
            br.code
          FROM branches br
          WHERE br.business_id = CAST(${businessId} AS uuid)
            AND br.is_active = true
          ORDER BY br.name
        `,
      );
    }

    return this.prisma.$queryRaw<BranchOption[]>(
      Prisma.sql`
        SELECT DISTINCT
          br.id,
          br.name,
          br.code
        FROM user_business_roles ubr
        INNER JOIN branches br ON br.id = ubr.branch_id
        WHERE ubr.user_id = CAST(${userId} AS uuid)
          AND ubr.business_id = CAST(${businessId} AS uuid)
          AND ubr.is_active = true
          AND br.is_active = true
        ORDER BY br.name
      `,
    );
  }

  async getAccessibleRegisters(
    userId: string,
    businessId: string,
    branchId: string,
  ) {
    await this.assertBranchAccess(userId, businessId, branchId);

    return this.prisma.$queryRaw<RegisterOption[]>(
      Prisma.sql`
        SELECT
          r.id,
          r.name,
          r.code
        FROM registers r
        WHERE r.business_id = CAST(${businessId} AS uuid)
          AND r.branch_id = CAST(${branchId} AS uuid)
          AND r.is_active = true
        ORDER BY r.name
      `,
    );
  }
}
