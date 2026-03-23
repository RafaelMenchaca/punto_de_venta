import { IsString, IsUUID, MinLength } from 'class-validator';

export class SearchProductsDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsString()
  @MinLength(1)
  query!: string;
}
