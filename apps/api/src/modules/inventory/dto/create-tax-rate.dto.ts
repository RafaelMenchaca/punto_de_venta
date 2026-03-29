import { IsNumber, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateTaxRateDto {
  @IsUUID()
  business_id!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsNumber()
  @Min(0)
  rate!: number;
}
