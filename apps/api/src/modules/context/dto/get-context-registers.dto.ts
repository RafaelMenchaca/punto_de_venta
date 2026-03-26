import { IsUUID } from 'class-validator';

export class GetContextRegistersDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;
}
