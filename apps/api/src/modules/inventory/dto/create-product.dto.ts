import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsString()
  @MinLength(1)
  sku!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  brand_id?: string;

  @IsOptional()
  @IsUUID()
  tax_rate_id?: string;

  @IsNumber()
  @Min(0)
  cost_price!: number;

  @IsNumber()
  @Min(0)
  sale_price!: number;

  @IsNumber()
  @Min(0)
  min_stock!: number;

  @IsBoolean()
  track_inventory!: boolean;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initial_stock?: number;
}
