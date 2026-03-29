import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ListSuppliersDto {
  @IsUUID()
  business_id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'bigint'
    ) {
      return undefined;
    }

    const normalized = `${value}`.toLowerCase();
    return normalized === 'true' || normalized === '1';
  })
  include_inactive?: boolean;
}
