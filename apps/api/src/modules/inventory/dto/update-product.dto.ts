import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductDto {
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
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  additional_barcodes?: string[];

  @IsOptional()
  @IsString()
  primary_image_url?: string;
}
