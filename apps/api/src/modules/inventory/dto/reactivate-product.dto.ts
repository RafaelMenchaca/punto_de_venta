import { IsUUID } from 'class-validator';

export class ReactivateProductDto {
  @IsUUID()
  business_id!: string;
}
