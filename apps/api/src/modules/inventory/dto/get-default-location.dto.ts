import { IsUUID } from 'class-validator';

export class GetDefaultLocationDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;
}
