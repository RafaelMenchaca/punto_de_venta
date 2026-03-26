import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CashMovementType } from '../../../common/enums/cash-movement-type.enum';

export class CreateCashMovementDto {
  @IsIn([CashMovementType.INCOME, CashMovementType.EXPENSE])
  movement_type!: CashMovementType;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
