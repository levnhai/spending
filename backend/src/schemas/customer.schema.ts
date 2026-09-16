import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerDocument = Customer & Document;

export enum CustomerGroup {
  VIP = 'VIP', // Khách VIP
  REGULAR = 'REGULAR', // Khách quen
  WHOLESALE = 'WHOLESALE', // Khách sỉ
  RETAIL = 'RETAIL', // Khách lẻ
  BAD_DEBT = 'BAD_DEBT', // Nợ xấu / Boom hàng / Cần lưu ý
}

@Schema({ timestamps: true })
export class Customer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId; // Sales sở hữu khách hàng này

  @Prop({ required: true, trim: true })
  name: string; // Tên khách hàng

  @Prop({ default: '', trim: true })
  phone: string; // Số điện thoại

  @Prop({ default: '', trim: true })
  facebookUrl: string; // Link Facebook

  @Prop({ default: '', trim: true })
  zaloPhone: string; // Số Zalo (nếu khác SĐT)

  @Prop({ default: '', trim: true })
  address: string; // Địa chỉ giao hàng mặc định

  @Prop({ default: CustomerGroup.RETAIL, enum: CustomerGroup })
  group: CustomerGroup; // Nhóm khách hàng

  @Prop({ type: [String], default: [] })
  tags: string[]; // Các nhãn tùy chọn: vd ['chuyển khoản trước', 'khách vip', 'freeship']

  @Prop({ default: '' })
  note: string; // Ghi chú cá nhân / sở thích của khách

  @Prop({ default: 0 })
  totalSpent: number; // Tổng số tiền đã mua (LTV)

  @Prop({ default: 0 })
  totalOrders: number; // Tổng số đơn hàng đã đặt

  @Prop({ default: 0 })
  debtAmount: number; // Tổng tiền còn nợ

  @Prop({ default: null })
  lastOrderDate: Date; // Ngày mua gần nhất
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ userId: 1, name: 1 });
CustomerSchema.index({ userId: 1, phone: 1 });
CustomerSchema.index({ userId: 1, group: 1 });
CustomerSchema.index({ userId: 1, debtAmount: -1 });
CustomerSchema.index({ userId: 1, totalSpent: -1 });
CustomerSchema.index({ userId: 1, updatedAt: -1 });
