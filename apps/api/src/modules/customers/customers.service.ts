import { BadRequestException, Injectable } from '@nestjs/common';
import { SALES_OPERATION_ROLES } from '../../common/authz/role-groups';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';
import { BusinessAccessService } from '../shared-db/business-access.service';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import type { GetCustomersDto } from './dto/get-customers.dto';
import { CustomersRepository } from './customers.repository';

@Injectable()
export class CustomersService {
  constructor(
    private readonly auditService: AuditService,
    private readonly businessAccessService: BusinessAccessService,
    private readonly customersRepository: CustomersRepository,
  ) {}

  async getCustomers(query: GetCustomersDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      query.business_id,
    );
    await this.businessAccessService.assertBusinessRole(
      user.id,
      query.business_id,
      SALES_OPERATION_ROLES,
      null,
      'No tienes permiso para operar clientes.',
    );

    return this.customersRepository.listCustomers(
      query.business_id,
      query.query,
      query.limit ?? 12,
    );
  }

  async createCustomer(input: CreateCustomerDto, user: RequestUser) {
    await this.businessAccessService.assertBusinessMembership(
      user.id,
      input.business_id,
    );
    await this.businessAccessService.assertBusinessRole(
      user.id,
      input.business_id,
      SALES_OPERATION_ROLES,
      null,
      'No tienes permiso para operar clientes.',
    );

    const normalizedEmail = input.email?.trim().toLowerCase() ?? null;
    const normalizedPhone = input.phone?.trim() ?? null;

    if (!input.full_name.trim()) {
      throw new BadRequestException('Debes capturar el nombre del cliente.');
    }

    const customer = await this.customersRepository.createCustomer({
      businessId: input.business_id,
      fullName: input.full_name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      notes: input.notes?.trim() ?? null,
    });

    await this.auditService.logAction({
      businessId: input.business_id,
      actorUserId: user.id,
      action: 'create_customer',
      entityType: 'customer',
      entityId: customer.id,
      afterJson: customer,
    });

    return customer;
  }
}
