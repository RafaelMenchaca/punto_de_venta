import { IsOptional, IsUUID } from 'class-validator';

export class GetProductStockDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsOptional()
  @IsUUID()
  location_id?: string;
}
