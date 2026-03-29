import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateRefundItemDto {
  @IsUUID()
  sale_item_id!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;
}

export class CreateRefundDto {
  @IsUUID()
  sale_id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRefundItemDto)
  items!: CreateRefundItemDto[];
}
