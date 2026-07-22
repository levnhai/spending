import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from '../../schemas/transaction.schema';
import { Wallet, WalletDocument } from '../../schemas/wallet.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async getDashboardSummary(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Total balance across wallets
    const wallets = await this.walletModel.find({ userId: userObjId });
    const totalBalance = wallets.reduce((sum, w) => sum + w.currentBalance, 0);

    // Monthly Income & Expense
    const monthlyStats = await this.transactionModel.aggregate([
      {
        $match: {
          userId: userObjId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    monthlyStats.forEach((stat) => {
      if (stat._id === TransactionType.INCOME) monthlyIncome = stat.total;
      if (stat._id === TransactionType.EXPENSE) monthlyExpense = stat.total;
    });

    // Today Income & Expense
    const todayStats = await this.transactionModel.aggregate([
      {
        $match: {
          userId: userObjId,
          date: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let todayIncome = 0;
    let todayExpense = 0;
    todayStats.forEach((stat) => {
      if (stat._id === TransactionType.INCOME) todayIncome = stat.total;
      if (stat._id === TransactionType.EXPENSE) todayExpense = stat.total;
    });

    const totalTransactions = await this.transactionModel.countDocuments({ userId: userObjId });

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      todayIncome,
      todayExpense,
      totalTransactions,
      netMonthly: monthlyIncome - monthlyExpense,
    };
  }

  async getPieChartCategoryData(userId: string, month?: number, year?: number) {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();
    const m = month ? Number(month) : now.getMonth() + 1;
    const y = year ? Number(year) : now.getFullYear();

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);

    const result = await this.transactionModel.aggregate([
      {
        $match: {
          userId: userObjId,
          type: TransactionType.EXPENSE,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryId',
          name: { $first: { $ifNull: ['$category.name', 'Khác'] } },
          color: { $first: { $ifNull: ['$category.color', '#6B7280'] } },
          icon: { $first: { $ifNull: ['$category.icon', 'Tag'] } },
          value: { $sum: '$amount' },
        },
      },
      { $sort: { value: -1 } },
    ]);

    return result;
  }

  async getBarChartMonthlyComparison(userId: string, year?: number) {
    const userObjId = new Types.ObjectId(userId);
    const y = year ? Number(year) : new Date().getFullYear();

    const startOfYear = new Date(y, 0, 1);
    const endOfYear = new Date(y, 11, 31, 23, 59, 59);

    const result = await this.transactionModel.aggregate([
      {
        $match: {
          userId: userObjId,
          date: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Format for 12 months
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: `Thg ${i + 1}`,
      income: 0,
      expense: 0,
    }));

    result.forEach((item) => {
      const monthIdx = item._id.month - 1;
      if (item._id.type === TransactionType.INCOME) {
        monthlyData[monthIdx].income = item.total;
      } else if (item._id.type === TransactionType.EXPENSE) {
        monthlyData[monthIdx].expense = item.total;
      }
    });

    return monthlyData;
  }

  async getLineChartDailyTrend(userId: string, month?: number, year?: number) {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();
    const m = month ? Number(month) : now.getMonth() + 1;
    const y = year ? Number(year) : now.getFullYear();

    const daysInMonth = new Date(y, m, 0).getDate();
    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);

    const result = await this.transactionModel.aggregate([
      {
        $match: {
          userId: userObjId,
          type: TransactionType.EXPENSE,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const found = result.find((r) => r._id === dayNum);
      return {
        day: `${dayNum}/${m}`,
        amount: found ? found.totalSpent : 0,
      };
    });

    return dailyData;
  }

  async getTopSpendingCategories(userId: string, month?: number, year?: number) {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();
    const m = month ? Number(month) : now.getMonth() + 1;
    const y = year ? Number(year) : now.getFullYear();

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);

    const categories = await this.getPieChartCategoryData(userId, m, y);
    const totalSpent = categories.reduce((sum: number, c: any) => sum + c.value, 0);

    return categories.slice(0, 5).map((cat: any) => ({
      ...cat,
      percentage: totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0,
    }));
  }
}
