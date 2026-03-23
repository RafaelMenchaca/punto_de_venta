import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CloseCashSessionDto {
  @IsUUID()
  cash_session_id!: string;

  @IsNumber()
  closing_counted!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
