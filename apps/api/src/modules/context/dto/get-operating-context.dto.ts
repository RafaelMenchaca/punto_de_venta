import { IsOptional, IsUUID } from 'class-validator';

export class GetOperatingContextDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsOptional()
  @IsUUID()
  register_id?: string;
}
