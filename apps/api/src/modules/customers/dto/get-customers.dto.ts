import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class GetCustomersDto {
  @IsUUID()
  business_id!: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}
