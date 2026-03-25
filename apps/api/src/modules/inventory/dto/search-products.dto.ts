import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchProductsDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsOptional()
  @IsString()
  query?: string;
}
