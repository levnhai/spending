import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { DebtType, DebtStatus } from '../../../schemas/debt.schema';

export class CreateDebtDto {
  @IsNotEmpty({ message: 'Tên người vay/cho vay không được để trống' })
  @IsString()
  personName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: 'Loại nợ không hợp lệ' })
  @IsEnum(DebtType)
  type: DebtType;

  @IsNotEmpty({ message: 'Số tiền không được để trống' })
  @IsNumber()
  @Min(0, { message: 'Số tiền phải lớn hơn 0' })
  amount: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  walletId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDebtDto {
  @IsOptional()
  @IsString()
  personName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordPaymentDto {
  @IsNotEmpty({ message: 'Số tiền thanh toán không được để trống' })
  @IsNumber()
  @Min(1, { message: 'Số tiền thanh toán phải lớn hơn 0' })
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  walletId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
