import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateBrandDto {
  @IsUUID()
  business_id!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
