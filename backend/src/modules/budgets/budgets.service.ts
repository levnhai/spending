import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from '../../schemas/budget.schema';
import { Transaction, TransactionDocument, TransactionType } from '../../schemas/transaction.schema';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async findAll(userId: string, month: number, year: number) {
    const userObjId = new Types.ObjectId(userId);
    const budgets = await this.budgetModel
      .find({ userId: userObjId, month, year })
      .populate('categoryId');

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // Calculate actual spent amount for each budget category
    const result = await Promise.all(
      budgets.map(async (budget) => {
        const spentAggregation = await this.transactionModel.aggregate([
          {
            $match: {
              userId: userObjId,
              categoryId: budget.categoryId ? budget.categoryId['_id'] : null,
              type: TransactionType.EXPENSE,
              date: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' },
            },
          },
        ]);

        const spentAmount = spentAggregation.length > 0 ? spentAggregation[0].totalSpent : 0;
        const remaining = budget.limitAmount - spentAmount;
        const percentage = Math.round((spentAmount / budget.limitAmount) * 100);
        const isExceeded = spentAmount > budget.limitAmount;
        const isWarning = spentAmount >= budget.limitAmount * (budget.alertThreshold || 0.8);

        return {
          ...budget.toObject(),
          spentAmount,
          remaining,
          percentage,
          isExceeded,
          isWarning,
        };
      }),
    );

    return result;
  }

  async create(userId: string, dto: CreateBudgetDto) {
    const userObjId = new Types.ObjectId(userId);
    const existing = await this.budgetModel.findOne({
      userId: userObjId,
      categoryId: new Types.ObjectId(dto.categoryId),
      month: dto.month,
      year: dto.year,
    });

    if (existing) {
      existing.limitAmount = dto.limitAmount;
      if (dto.alertThreshold) existing.alertThreshold = dto.alertThreshold;
      return (await existing.save()).populate('categoryId');
    }

    const budget = await this.budgetModel.create({
      userId: userObjId,
      categoryId: new Types.ObjectId(dto.categoryId),
      limitAmount: dto.limitAmount,
      month: dto.month,
      year: dto.year,
      alertThreshold: dto.alertThreshold || 0.8,
    });

    return budget.populate('categoryId');
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.budgetModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: dto },
      { new: true },
    ).populate('categoryId');
    if (!budget) throw new NotFoundException('Không tìm thấy ngân sách');
    return budget;
  }

  async remove(userId: string, id: string) {
    const result = await this.budgetModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Không tìm thấy ngân sách');
    return { message: 'Đã xóa ngân sách' };
  }
}
