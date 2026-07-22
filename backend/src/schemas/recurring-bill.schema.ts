import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecurringBillDocument = RecurringBill & Document;

@Schema({ timestamps: true })
export class RecurringBill {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  walletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 'monthly' })
  frequency: string; // 'monthly', 'weekly', 'yearly'

  @Prop({ required: true })
  dueDate: number; // Day of month (1-31)

  @Prop({ default: true })
  autoCreateTransaction: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const RecurringBillSchema = SchemaFactory.createForClass(RecurringBill);
