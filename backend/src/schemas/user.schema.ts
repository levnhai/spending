import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  PERSONAL = 'PERSONAL', // Chế độ Cá nhân (Quản lý chi tiêu, ví, tiết kiệm)
  SALES = 'SALES',       // Chế độ Bán hàng (Quản lý đơn hàng, khách hàng, doanh số)
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

  @Prop({ type: [String], default: [] })
  hiddenMenus: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
