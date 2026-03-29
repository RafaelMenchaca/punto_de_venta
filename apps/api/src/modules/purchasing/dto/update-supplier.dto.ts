import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateSupplierDto {
  @IsUUID()
  business_id!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  contact_name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
