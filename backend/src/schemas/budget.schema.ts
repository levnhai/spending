import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  limitAmount: number;

  @Prop({ required: true })
  month: number; // 1-12

  @Prop({ required: true })
  year: number;

  @Prop({ default: 0.8 })
  alertThreshold: number; // 80%
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
