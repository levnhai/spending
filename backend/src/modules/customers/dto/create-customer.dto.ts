import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerGroup } from '../../../schemas/customer.schema';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Nguyễn Văn Nam' })
  @IsString()
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  name: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/nam.nguyen' })
  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  zaloPhone?: string;

  @ApiPropertyOptional({ example: '123 Cầu Giấy, Hà Nội' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: CustomerGroup, default: CustomerGroup.RETAIL })
  @IsOptional()
  @IsEnum(CustomerGroup)
  group?: CustomerGroup;

  @ApiPropertyOptional({ type: [String], example: ['khách quen', 'thích freeship'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Khách hay mua dịp lễ, thích size XL' })
  @IsOptional()
  @IsString()
  note?: string;
}
