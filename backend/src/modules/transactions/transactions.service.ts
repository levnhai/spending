import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from '../../schemas/transaction.schema';
import { Wallet, WalletDocument, WalletType } from '../../schemas/wallet.schema';
import { SavingsGoal, SavingsGoalDocument } from '../../schemas/savings-goal.schema';
import { CreateTransactionDto, FilterTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(SavingsGoal.name) private goalModel: Model<SavingsGoalDocument>,
  ) {}

  private async syncSavingsGoal(wallet: WalletDocument | null) {
    if (!wallet) return;
    if (wallet.savingsGoalId || wallet.type === WalletType.SAVINGS) {
      const goal = await this.goalModel.findOne({
        $or: [{ _id: wallet.savingsGoalId }, { walletId: wallet._id }],
      });
      if (goal) {
        goal.currentAmount = wallet.currentBalance;
        goal.isCompleted = goal.currentAmount >= goal.targetAmount;
        await goal.save();
      }
    }
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const userObjId = new Types.ObjectId(userId);
    const walletObjId = new Types.ObjectId(dto.walletId);

    const wallet = await this.walletModel.findOne({ _id: walletObjId, userId: userObjId });
    if (!wallet) throw new NotFoundException('Ví không tồn tại');

    let toWallet: WalletDocument | null = null;
    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.toWalletId) throw new BadRequestException('Vui lòng chọn ví nhận');
      toWallet = await this.walletModel.findOne({ _id: new Types.ObjectId(dto.toWalletId), userId: userObjId });
      if (!toWallet) throw new NotFoundException('Ví nhận không tồn tại');
    }

    const transaction = await this.transactionModel.create({
      userId: userObjId,
      walletId: walletObjId,
      toWalletId: dto.toWalletId ? new Types.ObjectId(dto.toWalletId) : null,
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : null,
      amount: dto.amount,
      type: dto.type,
      date: dto.date ? new Date(dto.date) : new Date(),
      note: dto.note || '',
      tags: dto.tags || [],
    });

    // Update wallet balance
    if (dto.type === TransactionType.INCOME) {
      wallet.currentBalance += dto.amount;
      await wallet.save();
      await this.syncSavingsGoal(wallet);
    } else if (dto.type === TransactionType.EXPENSE) {
      wallet.currentBalance -= dto.amount;
      await wallet.save();
      await this.syncSavingsGoal(wallet);
    } else if (dto.type === TransactionType.TRANSFER && toWallet) {
      wallet.currentBalance -= dto.amount;
      toWallet.currentBalance += dto.amount;
      await wallet.save();
      await toWallet.save();
      await this.syncSavingsGoal(wallet);
      await this.syncSavingsGoal(toWallet);
    }

    return transaction.populate(['walletId', 'toWalletId', 'categoryId']);
  }

  async findAll(userId: string, filter: FilterTransactionDto) {
    const userObjId = new Types.ObjectId(userId);
    const query: any = { userId: userObjId };

    if (filter.walletId) {
      query.$or = [{ walletId: new Types.ObjectId(filter.walletId) }, { toWalletId: new Types.ObjectId(filter.walletId) }];
    }
    if (filter.categoryId) {
      query.categoryId = new Types.ObjectId(filter.categoryId);
    }
    if (filter.type) {
      query.type = filter.type;
    }
    if (filter.search) {
      query.note = { $regex: filter.search, $options: 'i' };
    }

    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) query.date.$gte = new Date(filter.startDate);
      if (filter.endDate) query.date.$lte = new Date(filter.endDate);
    } else if (filter.month && filter.year) {
      const start = new Date(filter.year, filter.month - 1, 1);
      const end = new Date(filter.year, filter.month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    return this.transactionModel
      .find(query)
      .populate('walletId')
      .populate('toWalletId')
      .populate('categoryId')
      .sort({ date: -1, createdAt: -1 });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.transactionModel
      .findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) })
      .populate('walletId')
      .populate('toWalletId')
      .populate('categoryId');
    if (!transaction) throw new NotFoundException('Không tìm thấy giao dịch');
    return transaction;
  }

  async remove(userId: string, id: string) {
    const transaction = await this.transactionModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!transaction) throw new NotFoundException('Không tìm thấy giao dịch');

    // Reverse balance effect
    const wallet = await this.walletModel.findById(transaction.walletId);
    if (wallet) {
      if (transaction.type === TransactionType.INCOME) {
        wallet.currentBalance -= transaction.amount;
        await wallet.save();
        await this.syncSavingsGoal(wallet);
      } else if (transaction.type === TransactionType.EXPENSE) {
        wallet.currentBalance += transaction.amount;
        await wallet.save();
        await this.syncSavingsGoal(wallet);
      } else if (transaction.type === TransactionType.TRANSFER && transaction.toWalletId) {
        wallet.currentBalance += transaction.amount;
        await wallet.save();
        await this.syncSavingsGoal(wallet);

        const toWallet = await this.walletModel.findById(transaction.toWalletId);
        if (toWallet) {
          toWallet.currentBalance -= transaction.amount;
          await toWallet.save();
          await this.syncSavingsGoal(toWallet);
        }
      }
    }

    await this.transactionModel.deleteOne({ _id: transaction._id });
    return { message: 'Đã xóa giao dịch thành công' };
  }
}
