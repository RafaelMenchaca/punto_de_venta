import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';

export interface InventoryLocationRecord {
  id: string;
  businessId: string;
  branchId: string;
  name: string | null;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefaultInventoryLocationByBranch(
    businessId: string,
    branchId: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<InventoryLocationRecord[]>(
      Prisma.sql`
        SELECT
          id,
          business_id AS "businessId",
          branch_id AS "branchId",
          name
        FROM inventory_locations
        WHERE business_id = ${businessId}
          AND branch_id = ${branchId}
        ORDER BY id
        LIMIT 1
      `,
    );

    if (rows.length === 0) {
      throw new NotFoundException(
        'No existe una ubicación de inventario disponible para la sucursal.',
      );
    }

    return rows[0]!;
  }

  async getAvailableStock(
    businessId: string,
    branchId: string,
    productId: string,
    locationId?: string,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;

    const rows = await executor.$queryRaw<Array<{ quantity: number }>>(
      locationId
        ? Prisma.sql`
            SELECT COALESCE(SUM(quantity), 0)::double precision AS quantity
            FROM stock_balances
            WHERE business_id = ${businessId}
              AND branch_id = ${branchId}
              AND location_id = ${locationId}
              AND product_id = ${productId}
          `
        : Prisma.sql`
            SELECT COALESCE(SUM(quantity), 0)::double precision AS quantity
            FROM stock_balances
            WHERE business_id = ${businessId}
              AND branch_id = ${branchId}
              AND product_id = ${productId}
          `,
    );

    return rows[0]?.quantity ?? 0;
  }
}
