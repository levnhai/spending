import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from '../../../schemas/order.schema';

export class OrderCustomerDto {
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

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ example: 12500000 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @ApiPropertyOptional({ example: '2026-09-03T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ enum: OrderStatus, default: OrderStatus.ORDERED })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: 30000, default: 0 })
  @IsOptional()
  @IsNumber()
  shippingFee?: number;

  @ApiPropertyOptional({ example: 45000, default: 0 })
  @IsOptional()
  @IsNumber()
  shippingFeeCnVn?: number;

  @ApiPropertyOptional({ example: 250000, default: 0 })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ example: 'Giao hàng trước 17h' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'Size M' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Màu Đen' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Số 123 Đường Cầu Giấy, Hà Nội' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1555041469' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'ORD-1001' })
  @IsOptional()
  @IsString()
  orderCode?: string;

  @ApiProperty({ example: 'Bộ sofa phòng khách gỗ sồi' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đơn hàng không được để trống' })
  title: string;

  @ApiPropertyOptional({ example: 'Size L' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Màu Trắng' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [OrderCustomerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderCustomerDto)
  customers?: OrderCustomerDto[];

  @ApiPropertyOptional({ example: 12500000 })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @ApiPropertyOptional({ example: 8000000 })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @IsNumber()
  shippingFee?: number;

  @ApiPropertyOptional({ example: 150000, default: 0 })
  @IsOptional()
  @IsNumber()
  shippingFeeCnVn?: number;

  @ApiPropertyOptional({ example: '2026-09-03T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ enum: OrderStatus, default: OrderStatus.ORDERED })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: 'Giao hàng trước 17h chiều' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'Số 123 Cầu Giấy, Hà Nội' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({ example: 'Số 123 Cầu Giấy, Hà Nội' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/nam.nguyen' })
  @IsOptional()
  @IsString()
  customerFacebookUrl?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/nam.nguyen' })
  @IsOptional()
  @IsString()
  facebookUrl?: string;
}
