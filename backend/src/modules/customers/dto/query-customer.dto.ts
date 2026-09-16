import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerGroup } from '../../../schemas/customer.schema';

export class QueryCustomerDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên, số điện thoại hoặc link Facebook' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CustomerGroup, description: 'Lọc theo nhóm khách hàng' })
  @IsOptional()
  @IsEnum(CustomerGroup)
  group?: CustomerGroup;

  @ApiPropertyOptional({ description: 'Lọc chỉ khách hàng có công nợ > 0' })
  @IsOptional()
  @IsString()
  hasDebt?: string;

  @ApiPropertyOptional({ description: 'Sắp xếp: debtAmount_desc, totalSpent_desc, name_asc, createdAt_desc' })
  @IsOptional()
  @IsString()
  sortBy?: string;
}
