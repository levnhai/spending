import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  PERSONAL = 'PERSONAL', // Chế độ Cá nhân (Quản lý chi tiêu, ví, tiết kiệm)
  SALES = 'SALES', // Chế độ Bán hàng (Quản lý đơn hàng, khách hàng, doanh số)
  ADMIN = 'ADMIN', // Chế độ Quản trị viên (Quản lý toàn bộ hệ thống & người dùng)
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ default: 'VND' })
  currency: string;

  @Prop({ default: 'vi' })
  language: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: UserRole.PERSONAL, enum: UserRole })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  hiddenMenus: string[];

  // Quản lý gói thuê bao & thời hạn sử dụng
  @Prop({ type: Number, default: null })
  subscriptionMonths?: number | null; // Số tháng đăng ký (1, 2, 3, 6, 12... hoặc null = Vĩnh viễn)

  @Prop({ default: 0 })
  monthlyPrice?: number; // Số tiền hàng tháng do Admin tự nhập

  @Prop({ default: 0 })
  totalAmountPaid?: number; // Tổng số tiền khách đã thanh toán

  @Prop({ type: Date, default: null })
  subscriptionStartDate?: Date | null; // Ngày bắt đầu tính gói

  @Prop({ type: Date, default: null })
  subscriptionExpiresAt?: Date | null; // Ngày hết hạn thuê bao
}

export const UserSchema = SchemaFactory.createForClass(User);
