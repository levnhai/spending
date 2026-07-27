import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MonthlyPlanDocument = MonthlyPlan & Document;

export class FixedExpenseItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'RecurringBill' })
  billId?: Types.ObjectId;
}

export class DebtRepaymentItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Debt' })
  debtId?: Types.ObjectId;
}

export class SavingsTargetItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'SavingsGoal' })
  goalId?: Types.ObjectId;
}

export class CategoryLimitItem {
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;
}

@Schema({ timestamps: true })
export class MonthlyPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  month: number; // 1-12

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, min: 0, default: 0 })
  expectedIncome: number;

  @Prop({ type: Array, default: [] })
  fixedExpenses: FixedExpenseItem[];

  @Prop({ type: Array, default: [] })
  debtRepayments: DebtRepaymentItem[];

  @Prop({ type: Array, default: [] })
  savingsTargets: SavingsTargetItem[];

  @Prop({ type: Array, default: [] })
  categoryLimits: CategoryLimitItem[];

  @Prop()
  notes?: string;
}

export const MonthlyPlanSchema = SchemaFactory.createForClass(MonthlyPlan);

// Ensure unique index per user, month, year
MonthlyPlanSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
