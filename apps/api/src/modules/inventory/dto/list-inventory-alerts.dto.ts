import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { StockAlertStatus } from '../../../common/enums/stock-alert-status.enum';

export class ListInventoryAlertsDto {
  @IsUUID()
  business_id!: string;

  @IsUUID()
  branch_id!: string;

  @IsOptional()
  @IsEnum(StockAlertStatus)
  status?: StockAlertStatus;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
