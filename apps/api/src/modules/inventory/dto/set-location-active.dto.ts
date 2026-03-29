import { IsUUID } from 'class-validator';

export class SetLocationActiveDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;
}
