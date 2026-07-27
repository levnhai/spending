import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NoteDocument = Note & Document;

@Schema({ timestamps: true })
export class Note {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['note', 'task'], default: 'note' })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  content: string;

  @Prop({ default: 'Cá nhân' })
  category: string;

  @Prop({ default: 'emerald' })
  color: string;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string;

  @Prop({ enum: ['todo', 'in_progress', 'completed', 'cancelled'], default: 'todo' })
  status?: string;

  @Prop({ type: Date, default: null })
  dueDate?: Date;

  @Prop({ type: Date, default: null })
  completedAt?: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: [{ id: String, title: String, completed: { type: Boolean, default: false } }],
    default: [],
  })
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
