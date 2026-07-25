import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note, NoteDocument } from '../../schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private noteModel: Model<NoteDocument>) {}

  async findAll(userId: string): Promise<Note[]> {
    return this.noteModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ isPinned: -1, updatedAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Note> {
    const note = await this.noteModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });
    if (!note) {
      throw new NotFoundException('Không tìm thấy ghi chú/công việc');
    }
    return note;
  }

  async create(userId: string, createNoteDto: CreateNoteDto): Promise<Note> {
    const payload: any = { ...createNoteDto };
    if (payload.status === 'completed' && !payload.completedAt) {
      payload.completedAt = new Date();
    }
    const newNote = new this.noteModel({
      ...payload,
      userId: new Types.ObjectId(userId),
    });
    return newNote.save();
  }

  async update(id: string, userId: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const payload: any = { ...updateNoteDto };
    if (payload.status === 'completed') {
      payload.completedAt = payload.completedAt || new Date();
    } else if (payload.status && payload.status !== 'completed') {
      payload.completedAt = null;
    }
    const note = await this.noteModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      payload,
      { new: true }
    );
    if (!note) {
      throw new NotFoundException('Không tìm thấy ghi chú/công việc');
    }
    return note;
  }

  async remove(id: string, userId: string): Promise<Note> {
    const note = await this.noteModel.findOneAndDelete({
      _id: id,
      userId: new Types.ObjectId(userId),
    });
    if (!note) {
      throw new NotFoundException('Không tìm thấy ghi chú/công việc');
    }
    return note;
  }

  async togglePin(id: string, userId: string): Promise<Note> {
    const note = await this.findOne(id, userId);
    note.isPinned = !note.isPinned;
    return (note as NoteDocument).save();
  }

  async updateStatus(id: string, userId: string, status: string): Promise<Note> {
    const note = await this.findOne(id, userId);
    note.status = status;
    if (status === 'completed') {
      note.completedAt = new Date();
    } else {
      note.completedAt = undefined;
    }
    return (note as NoteDocument).save();
  }
}
