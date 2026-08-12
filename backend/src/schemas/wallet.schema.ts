import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

export enum WalletType {
  CASH = 'cash',
  BANK = 'bank',
  EWALLET = 'ewallet',
  CREDIT = 'credit',
  SAVINGS = 'savings',
}

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: WalletType, default: WalletType.CASH })
  type: WalletType;

  @Prop({ required: true, default: 0 })
  initialBalance: number;

  @Prop({ required: true, default: 0 })
  currentBalance: number;

  @Prop({ default: '#10B981' })
  color: string;

  @Prop({ default: 'Wallet' })
  icon: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: false })
  isExcludedFromTotal: boolean;

  @Prop({ type: Types.ObjectId, ref: 'SavingsGoal', default: null })
  savingsGoalId: Types.ObjectId | null;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
