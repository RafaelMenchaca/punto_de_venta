import { IsUUID } from 'class-validator';

export class DeactivateProductDto {
  @IsUUID()
  business_id!: string;
}
