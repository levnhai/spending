import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SavingsGoalDocument = SavingsGoal & Document;

@Schema({ timestamps: true })
export class SavingsGoal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 0 })
  targetAmount: number;

  @Prop({ default: 0, min: 0 })
  currentAmount: number;

  @Prop({ default: null })
  deadline: Date;

  @Prop({ default: 'Target' })
  icon: string;

  @Prop({ default: '#3B82F6' })
  color: string;

  @Prop({ default: false })
  isCompleted: boolean;
}

export const SavingsGoalSchema = SchemaFactory.createForClass(SavingsGoal);
