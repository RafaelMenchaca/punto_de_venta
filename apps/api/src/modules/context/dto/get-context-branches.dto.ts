import { IsUUID } from 'class-validator';

export class GetContextBranchesDto {
  @IsUUID()
  business_id!: string;
}
