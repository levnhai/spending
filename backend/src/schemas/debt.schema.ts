import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DebtDocument = Debt & Document;

export enum DebtType {
  BORROWED = 'BORROWED', // Tôi đi vay (Nợ phải trả)
  LENT = 'LENT',         // Tôi cho mượn (Cho nợ / Nợ tôi)
}

export enum DebtStatus {
  UNPAID = 'UNPAID',     // Chưa thanh toán
  PARTIAL = 'PARTIAL',   // Đã trả một phần
  PAID = 'PAID',         // Đã thanh toán xong
}

export class PaymentRecord {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop({ type: Types.ObjectId, ref: 'Wallet' })
  walletId?: Types.ObjectId;

  @Prop()
  note?: string;
}

@Schema({ timestamps: true })
export class Debt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  personName: string;

  @Prop()
  phone?: string;

  @Prop({ required: true, enum: DebtType })
  type: DebtType;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 0 })
  paidAmount: number;

  @Prop({ required: true, default: Date.now })
  startDate: Date;

  @Prop()
  dueDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Wallet' })
  walletId?: Types.ObjectId;

  @Prop({ required: true, enum: DebtStatus, default: DebtStatus.UNPAID })
  status: DebtStatus;

  @Prop()
  notes?: string;

  @Prop({ type: Array, default: [] })
  payments: PaymentRecord[];
}

export const DebtSchema = SchemaFactory.createForClass(Debt);
