import { IsUUID } from 'class-validator';

export class GetOpenCashSessionDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;
}
