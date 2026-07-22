import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavingsGoal, SavingsGoalDocument } from '../../schemas/savings-goal.schema';
import { CreateSavingsGoalDto, DepositSavingsDto } from './dto/savings-goal.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(@InjectModel(SavingsGoal.name) private goalModel: Model<SavingsGoalDocument>) {}

  async findAll(userId: string) {
    const goals = await this.goalModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });

    return goals.map((goal) => {
      const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
      return {
        ...goal.toObject(),
        percentage,
      };
    });
  }

  async create(userId: string, dto: CreateSavingsGoalDto) {
    const goal = await this.goalModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      currentAmount: dto.currentAmount || 0,
      isCompleted: (dto.currentAmount || 0) >= dto.targetAmount,
    });
    return goal;
  }

  async deposit(userId: string, id: string, dto: DepositSavingsDto) {
    const goal = await this.goalModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!goal) throw new NotFoundException('Không tìm thấy mục tiêu tiết kiệm');

    goal.currentAmount += dto.amount;
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }
    await goal.save();
    return goal;
  }

  async remove(userId: string, id: string) {
    const result = await this.goalModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Không tìm thấy mục tiêu');
    return { message: 'Đã xóa mục tiêu tiết kiệm' };
  }
}
