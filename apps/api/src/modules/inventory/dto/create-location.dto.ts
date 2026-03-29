import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateLocationDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(40)
  code!: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  is_default?: boolean;
}
