import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({ example: '60d5ec49f1b2c81a2c8e4333' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 3000000 })
  @IsNumber()
  limitAmount: number;

  @ApiProperty({ example: 7 })
  @IsNumber()
  month: number;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  year: number;

  @ApiPropertyOptional({ example: 0.8 })
  @IsOptional()
  @IsNumber()
  alertThreshold?: number;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limitAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  alertThreshold?: number;
}
