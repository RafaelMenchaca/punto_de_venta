import { IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateStockAdjustmentDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsUUID()
  location_id!: string;

  @IsUUID()
  product_id!: string;

  @IsNumber()
  @Min(0)
  new_quantity!: number;

  @IsString()
  reason!: string;
}
