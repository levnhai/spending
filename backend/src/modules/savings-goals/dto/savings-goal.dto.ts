import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSavingsGoalDto {
  @ApiProperty({ example: 'Mua Laptop Gaming' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 30000000 })
  @IsNumber()
  targetAmount: number;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  currentAmount?: number;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: 'Laptop' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class DepositSavingsDto {
  @ApiProperty({ example: 1000000 })
  @IsNumber()
  amount: number;
}
