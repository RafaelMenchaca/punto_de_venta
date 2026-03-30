import { UserRole } from '../enums/user-role.enum';

export const FULL_OPERATION_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.MANAGER,
] as const;

export const CASH_OPERATION_ROLES = [
  ...FULL_OPERATION_ROLES,
  UserRole.CASHIER,
] as const;

export const SALES_OPERATION_ROLES = CASH_OPERATION_ROLES;

export const INVENTORY_MUTATION_ROLES = [
  ...FULL_OPERATION_ROLES,
  UserRole.INVENTORY_CLERK,
] as const;

export const INVENTORY_READ_ROLES = [
  ...INVENTORY_MUTATION_ROLES,
  UserRole.VIEWER,
] as const;

export const PURCHASING_ADMIN_ROLES = FULL_OPERATION_ROLES;

export const PURCHASING_OPERATION_ROLES = [
  ...FULL_OPERATION_ROLES,
  UserRole.INVENTORY_CLERK,
] as const;

export const PURCHASING_READ_ROLES = [
  ...PURCHASING_OPERATION_ROLES,
  UserRole.VIEWER,
] as const;

export const REPORT_READ_ROLES = [
  ...FULL_OPERATION_ROLES,
  UserRole.VIEWER,
] as const;
