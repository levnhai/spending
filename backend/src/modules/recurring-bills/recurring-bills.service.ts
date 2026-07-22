import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RecurringBill, RecurringBillDocument } from '../../schemas/recurring-bill.schema';
import { CreateRecurringBillDto, UpdateRecurringBillDto } from './dto/recurring-bill.dto';

@Injectable()
export class RecurringBillsService {
  constructor(
    @InjectModel(RecurringBill.name) private billModel: Model<RecurringBillDocument>,
  ) {}

  async findAll(userId: string) {
    return this.billModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('walletId')
      .populate('categoryId')
      .sort({ dueDate: 1 });
  }

  async create(userId: string, dto: CreateRecurringBillDto) {
    const bill = await this.billModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      walletId: new Types.ObjectId(dto.walletId),
      categoryId: new Types.ObjectId(dto.categoryId),
    });
    return bill.populate(['walletId', 'categoryId']);
  }

  async update(userId: string, id: string, dto: UpdateRecurringBillDto) {
    const bill = await this.billModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
        { $set: dto },
        { new: true },
      )
      .populate(['walletId', 'categoryId']);
    if (!bill) throw new NotFoundException('Không tìm thấy hóa đơn định kỳ');
    return bill;
  }

  async remove(userId: string, id: string) {
    const result = await this.billModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Không tìm thấy hóa đơn');
    return { message: 'Đã xóa hóa đơn định kỳ' };
  }
}
