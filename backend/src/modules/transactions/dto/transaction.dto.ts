import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../../schemas/transaction.schema';

export class CreateTransactionDto {
  @ApiProperty({ example: '60d5ec49f1b2c81a2c8e4111' })
  @IsNotEmpty()
  @IsString()
  walletId: string;

  @ApiPropertyOptional({ example: '60d5ec49f1b2c81a2c8e4222' })
  @IsOptional()
  @IsString()
  toWalletId?: string;

  @ApiPropertyOptional({ example: '60d5ec49f1b2c81a2c8e4333' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ example: '2026-07-22T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Ăn trưa mỳ cay' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: ['#an-uong', '#tra-sua'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class FilterTransactionDto {
  @IsOptional()
  @IsString()
  walletId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  month?: number;

  @IsOptional()
  year?: number;
}
