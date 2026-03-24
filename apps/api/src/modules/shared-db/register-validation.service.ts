import { NotFoundException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RegisterValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async assertRegisterBelongsToBranch(
    registerId: string,
    branchId: string,
    businessId: string,
  ) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM registers
        WHERE id = CAST(${registerId} AS uuid)
          AND branch_id = CAST(${branchId} AS uuid)
          AND business_id = CAST(${businessId} AS uuid)
        LIMIT 1
      `,
    );

    if (rows.length === 0) {
      throw new NotFoundException(
        'La caja indicada no pertenece a la sucursal o negocio solicitado.',
      );
    }
  }
}
