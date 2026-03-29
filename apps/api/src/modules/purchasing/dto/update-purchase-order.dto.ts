import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdatePurchaseOrderItemDto {
  @IsUUID()
  product_id!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unit_cost!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_rate?: number;
}

export class UpdatePurchaseOrderDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseOrderItemDto)
  items?: UpdatePurchaseOrderItemDto[];
}
