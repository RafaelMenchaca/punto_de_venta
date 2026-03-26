import { IsOptional, IsUUID } from 'class-validator';

export class GetOperatingContextDto {
  @IsOptional()
  @IsUUID()
  business_id?: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @IsOptional()
  @IsUUID()
  register_id?: string;
}
