import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRecurringBillDto {
  @ApiProperty({ example: '60d5ec49f1b2c81a2c8e4111' })
  @IsNotEmpty()
  @IsString()
  walletId: string;

  @ApiProperty({ example: '60d5ec49f1b2c81a2c8e4333' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Tiền mạng Internet FPT' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'monthly' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiProperty({ example: 5 }) // Ngày 5 hàng tháng
  @IsNumber()
  dueDate: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoCreateTransaction?: boolean;
}

export class UpdateRecurringBillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dueDate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
