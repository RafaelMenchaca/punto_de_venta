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

export class CreateGoodsReceiptItemDto {
  @IsOptional()
  @IsUUID()
  purchase_order_item_id?: string;

  @IsUUID()
  product_id!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_cost?: number;
}

export class CreateGoodsReceiptDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsUUID()
  purchase_order_id!: string;

  @IsOptional()
  @IsUUID()
  location_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptItemDto)
  items!: CreateGoodsReceiptItemDto[];
}
