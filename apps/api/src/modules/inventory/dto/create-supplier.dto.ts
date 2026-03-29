import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateSupplierDto {
  @IsUUID()
  business_id!: string;

  @IsString()
  @MinLength(1)
  name!: string;

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
  notes?: string;
}
