import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavingsGoal, SavingsGoalDocument } from '../../schemas/savings-goal.schema';
import { Wallet, WalletDocument, WalletType } from '../../schemas/wallet.schema';
import { Transaction, TransactionDocument, TransactionType } from '../../schemas/transaction.schema';
import { CreateSavingsGoalDto, DepositSavingsDto } from './dto/savings-goal.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(
    @InjectModel(SavingsGoal.name) private goalModel: Model<SavingsGoalDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async findAll(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const goals = await this.goalModel
      .find({ userId: userObjId })
      .sort({ createdAt: -1 });

    // Sync legacy goals that don't have a linked wallet yet
    for (const goal of goals) {
      if (!goal.walletId) {
        let wallet = await this.walletModel.findOne({ savingsGoalId: goal._id, userId: userObjId });
        if (!wallet) {
          wallet = await this.walletModel.create({
            userId: userObjId,
            name: goal.title,
            type: WalletType.SAVINGS,
            initialBalance: 0,
            currentBalance: goal.currentAmount,
            color: goal.color || '#3B82F6',
            icon: goal.icon || 'Target',
            isExcludedFromTotal: true,
            savingsGoalId: goal._id,
          });
        }
        goal.walletId = wallet._id as Types.ObjectId;
        await goal.save();
      }
    }

    return goals.map((goal) => {
      const percentage = goal.targetAmount > 0
        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
        : 0;
      return {
        ...goal.toObject(),
        percentage,
      };
    });
  }

  async create(userId: string, dto: CreateSavingsGoalDto) {
    const userObjId = new Types.ObjectId(userId);
    const initialAmount = dto.currentAmount || 0;

    const goal = await this.goalModel.create({
      ...dto,
      userId: userObjId,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      currentAmount: initialAmount,
      isCompleted: initialAmount >= dto.targetAmount,
    });

    // Create corresponding SAVINGS wallet
    const wallet = await this.walletModel.create({
      userId: userObjId,
      name: dto.title,
      type: WalletType.SAVINGS,
      initialBalance: 0,
      currentBalance: initialAmount,
      color: dto.color || '#3B82F6',
      icon: dto.icon || 'Target',
      isExcludedFromTotal: true,
      savingsGoalId: goal._id,
    });

    goal.walletId = wallet._id as Types.ObjectId;
    await goal.save();

    return goal;
  }

  async deposit(userId: string, id: string, dto: DepositSavingsDto) {
    const userObjId = new Types.ObjectId(userId);
    const goal = await this.goalModel.findOne({
      _id: new Types.ObjectId(id),
      userId: userObjId,
    });
    if (!goal) throw new NotFoundException('Không tìm thấy mục tiêu tiết kiệm');

    // Ensure goal wallet exists
    let goalWallet: WalletDocument | null = null;
    if (goal.walletId) {
      goalWallet = await this.walletModel.findOne({ _id: goal.walletId, userId: userObjId });
    }
    if (!goalWallet) {
      goalWallet = await this.walletModel.create({
        userId: userObjId,
        name: goal.title,
        type: WalletType.SAVINGS,
        initialBalance: 0,
        currentBalance: goal.currentAmount,
        color: goal.color || '#3B82F6',
        icon: goal.icon || 'Target',
        isExcludedFromTotal: true,
        savingsGoalId: goal._id,
      });
      goal.walletId = goalWallet._id as Types.ObjectId;
    }

    const isWithdraw = dto.type === 'withdraw';
    const amount = Number(dto.amount);
    if (!amount || amount <= 0) throw new BadRequestException('Số tiền không hợp lệ');

    if (dto.walletId) {
      const otherWallet = await this.walletModel.findOne({
        _id: new Types.ObjectId(dto.walletId),
        userId: userObjId,
      });
      if (!otherWallet) throw new NotFoundException('Ví đối ứng không tồn tại');

      const fromWallet = isWithdraw ? goalWallet : otherWallet;
      const toWallet = isWithdraw ? otherWallet : goalWallet;

      // Create transfer transaction
      await this.transactionModel.create({
        userId: userObjId,
        walletId: fromWallet._id,
        toWalletId: toWallet._id,
        amount,
        type: TransactionType.TRANSFER,
        date: new Date(),
        note: dto.note || (isWithdraw ? `Rút tiền từ mục tiêu: ${goal.title}` : `Tích lũy cho mục tiêu: ${goal.title}`),
      });

      fromWallet.currentBalance -= amount;
      toWallet.currentBalance += amount;
      await fromWallet.save();
      await toWallet.save();

      goal.currentAmount = goalWallet.currentBalance;
    } else {
      // Direct adjustment without source wallet
      if (isWithdraw) {
        goal.currentAmount = Math.max(0, goal.currentAmount - amount);
      } else {
        goal.currentAmount += amount;
      }
      goalWallet.currentBalance = goal.currentAmount;
      await goalWallet.save();
    }

    goal.isCompleted = goal.currentAmount >= goal.targetAmount;
    await goal.save();
    return goal;
  }

  async remove(userId: string, id: string) {
    const userObjId = new Types.ObjectId(userId);
    const goal = await this.goalModel.findOne({
      _id: new Types.ObjectId(id),
      userId: userObjId,
    });
    if (!goal) throw new NotFoundException('Không tìm thấy mục tiêu');

    if (goal.walletId) {
      await this.walletModel.deleteOne({ _id: goal.walletId, userId: userObjId });
    }
    await this.walletModel.deleteMany({ savingsGoalId: goal._id, userId: userObjId });

    await this.goalModel.deleteOne({ _id: goal._id });
    return { message: 'Đã xóa mục tiêu tiết kiệm thành công' };
  }
}
