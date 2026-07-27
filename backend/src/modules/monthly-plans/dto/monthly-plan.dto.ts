import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FixedExpenseItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  billId?: string;
}

export class DebtRepaymentItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  debtId?: string;
}

export class SavingsTargetItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  goalId?: string;
}

export class CategoryLimitItemDto {
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class SaveMonthlyPlanDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(2000)
  year: number;

  @IsNumber()
  @Min(0)
  expectedIncome: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FixedExpenseItemDto)
  fixedExpenses?: FixedExpenseItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DebtRepaymentItemDto)
  debtRepayments?: DebtRepaymentItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SavingsTargetItemDto)
  savingsTargets?: SavingsTargetItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryLimitItemDto)
  categoryLimits?: CategoryLimitItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
