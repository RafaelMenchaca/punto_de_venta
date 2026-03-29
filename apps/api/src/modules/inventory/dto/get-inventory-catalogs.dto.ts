import { IsUUID } from 'class-validator';

export class GetInventoryCatalogsDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;
}
