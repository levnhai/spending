import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId | null;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: CategoryType })
  type: CategoryType;

  @Prop({ default: 'Tag' })
  icon: string;

  @Prop({ default: '#6366F1' })
  color: string;

  @Prop({ default: false })
  isSystem: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
