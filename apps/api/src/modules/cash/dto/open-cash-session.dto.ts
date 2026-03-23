import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class OpenCashSessionDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsUUID()
  register_id!: string;

  @IsNumber()
  @Min(0)
  opening_amount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
