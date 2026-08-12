import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, IsHexColor, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletType } from '../../../schemas/wallet.schema';

export class CreateWalletDto {
  @ApiProperty({ example: 'Ví Tiền mặt' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: WalletType, example: WalletType.CASH })
  @IsEnum(WalletType)
  type: WalletType;

  @ApiProperty({ example: 1000000 })
  @IsNumber()
  initialBalance: number;

  @ApiPropertyOptional({ example: '#10B981' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Banknote' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExcludedFromTotal?: boolean;
}

export class UpdateWalletDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: WalletType })
  @IsOptional()
  @IsEnum(WalletType)
  type?: WalletType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExcludedFromTotal?: boolean;
}
