import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { PrismaExecutor } from '../../prisma/prisma.types';
import { PrismaService } from '../../prisma/prisma.service';

export interface CustomerRecord {
  id: string;
  businessId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(
    businessId: string,
    searchTerm?: string | null,
    limit = 12,
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const normalizedSearch = searchTerm?.trim() ?? null;

    return executor.$queryRaw<CustomerRecord[]>(
      Prisma.sql`
        SELECT
          id,
          business_id AS "businessId",
          full_name AS "fullName",
          email,
          phone,
          notes,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM customers
        WHERE business_id = CAST(${businessId} AS uuid)
          AND (
            ${normalizedSearch}::text IS NULL
            OR full_name ILIKE ${`%${normalizedSearch}%`}
            OR COALESCE(email, '') ILIKE ${`%${normalizedSearch}%`}
            OR COALESCE(phone, '') ILIKE ${`%${normalizedSearch}%`}
          )
        ORDER BY full_name ASC, created_at DESC
        LIMIT ${limit}
      `,
    );
  }

  async createCustomer(
    input: {
      businessId: string;
      fullName: string;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
    },
    tx?: PrismaExecutor,
  ) {
    const executor = tx ?? this.prisma;
    const rows = await executor.$queryRaw<CustomerRecord[]>(
      Prisma.sql`
        INSERT INTO customers (
          business_id,
          full_name,
          email,
          phone,
          notes,
          created_at,
          updated_at
        )
        VALUES (
          CAST(${input.businessId} AS uuid),
          ${input.fullName},
          ${input.email ?? null},
          ${input.phone ?? null},
          ${input.notes ?? null},
          NOW(),
          NOW()
        )
        RETURNING
          id,
          business_id AS "businessId",
          full_name AS "fullName",
          email,
          phone,
          notes,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
    );

    return rows[0]!;
  }
}
