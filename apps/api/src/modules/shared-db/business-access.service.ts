import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusinessAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertBusinessMembership(userId: string, businessId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ businessId: string }>>(
      Prisma.sql`
        SELECT business_id AS "businessId"
        FROM user_business_roles
        WHERE user_id = CAST(${userId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
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
        LIMIT 1
      `,
    );

    if (rows.length === 0) {
      throw new NotFoundException(
        'La sucursal no pertenece al negocio solicitado.',
      );
    }
  }
}
