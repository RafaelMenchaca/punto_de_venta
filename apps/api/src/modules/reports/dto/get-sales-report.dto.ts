import { IsOptional, IsUUID, Matches } from 'class-validator';

export class GetSalesReportDto {
  @IsUUID()
  business_id!: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @IsOptional()
  @IsUUID()
  register_id?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date_from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date_to?: string;
}
