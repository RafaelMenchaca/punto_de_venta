import { IsOptional, IsUUID } from 'class-validator';

export class GetInventoryValuationReportDto {
  @IsUUID()
  business_id!: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;
}
