import { IsUUID } from 'class-validator';

export class SetSupplierActiveDto {
  @IsUUID()
  business_id!: string;
}
