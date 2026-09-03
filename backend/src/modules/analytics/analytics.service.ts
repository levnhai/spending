import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from '../../schemas/transaction.schema';
import { Wallet, WalletDocument, WalletType } from '../../schemas/wallet.schema';
import { AppCacheService } from '../../common/cache/app-cache.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private readonly cacheService: AppCacheService,
  ) {}

  async getDashboardSummary(userId: string) {
    return this.cacheService.getOrSet(`analytics:summary:${userId}`, async () => {
      const userObjId = new Types.ObjectId(userId);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // Total balance across spending wallets (excluding savings goals)
      const wallets = await this.walletModel.find({ userId: userObjId });
      const totalBalance = wallets
        .filter((w) => w.type !== WalletType.SAVINGS && !w.isExcludedFromTotal)
        .reduce((sum, w) => sum + w.currentBalance, 0);

      const totalSavings = wallets
        .filter((w) => w.type === WalletType.SAVINGS || w.isExcludedFromTotal)
        .reduce((sum, w) => sum + w.currentBalance, 0);

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
        totalSavings,
        monthlyIncome,
        monthlyExpense,
        todayIncome,
        todayExpense,
        totalTransactions,
        netMonthly: monthlyIncome - monthlyExpense,
      };
    }, 30);
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
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const foundInc = result.find((r) => r._id.day === dayNum && r._id.type === TransactionType.INCOME);
      const foundExp = result.find((r) => r._id.day === dayNum && r._id.type === TransactionType.EXPENSE);
      return {
        day: `${dayNum}/${m}`,
        amount: foundExp ? foundExp.total : 0,
        income: foundInc ? foundInc.total : 0,
        expense: foundExp ? foundExp.total : 0,
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

  async getWeeklyComparison(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();

    // 7 ngày lấy Hôm nay làm trọng tâm ở giữa (vị trí thứ 4, offset từ -3 đến +3)
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 0, 0, 0, 0);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 23, 59, 59, 999);

    const result = await this.transactionModel.aggregate([
      {
        $match: {
          userId: userObjId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const dayNameMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const offset = i - 3; // -3, -2, -1, 0, 1, 2, 3
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const dateNum = d.getDate();
      const fullDate = `${dateNum.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}`;
      const dayOfWeek = dayNameMap[d.getDay()];
      const isToday = offset === 0;

      const inc = result.find(
        (r) => r._id.year === y && r._id.month === m && r._id.day === dateNum && r._id.type === TransactionType.INCOME,
      );
      const exp = result.find(
        (r) => r._id.year === y && r._id.month === m && r._id.day === dateNum && r._id.type === TransactionType.EXPENSE,
      );

      return {
        day: dayOfWeek,
        fullDate,
        income: inc ? inc.total : 0,
        expense: exp ? exp.total : 0,
        isToday,
      };
    });

    return weeklyData;
  }

  async getIncomePieChartCategoryData(userId: string, month?: number, year?: number) {
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
          type: TransactionType.INCOME,
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
          color: { $first: { $ifNull: ['$category.color', '#10B981'] } },
          icon: { $first: { $ifNull: ['$category.icon', 'Tag'] } },
          value: { $sum: '$amount' },
        },
      },
      { $sort: { value: -1 } },
    ]);

    return result;
  }

  async compareMonths(userId: string, m1: number, y1: number, m2: number, y2: number) {
    const userObjId = new Types.ObjectId(userId);

    const start1 = new Date(y1, m1 - 1, 1);
    const end1 = new Date(y1, m1, 0, 23, 59, 59);

    const start2 = new Date(y2, m2 - 1, 1);
    const end2 = new Date(y2, m2, 0, 23, 59, 59);

    const [txs1, txs2, cats1, cats2] = await Promise.all([
      this.transactionModel.find({ userId: userObjId, date: { $gte: start1, $lte: end1 } }),
      this.transactionModel.find({ userId: userObjId, date: { $gte: start2, $lte: end2 } }),
      this.getPieChartCategoryData(userId, m1, y1),
      this.getPieChartCategoryData(userId, m2, y2),
    ]);

    const inc1 = txs1.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const exp1 = txs1.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

    const inc2 = txs2.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const exp2 = txs2.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

    const catMap = new Map<string, { name: string; color: string; icon: string; val1: number; val2: number }>();

    cats1.forEach((c) => {
      catMap.set(c.name, { name: c.name, color: c.color, icon: c.icon, val1: c.value, val2: 0 });
    });

    cats2.forEach((c) => {
      if (catMap.has(c.name)) {
        catMap.get(c.name)!.val2 = c.value;
      } else {
        catMap.set(c.name, { name: c.name, color: c.color, icon: c.icon, val1: 0, val2: c.value });
      }
    });

    const categoryComparison = Array.from(catMap.values()).map((item) => ({
      ...item,
      diff: item.val2 - item.val1,
      diffPercent: item.val1 > 0 ? Math.round(((item.val2 - item.val1) / item.val1) * 100) : item.val2 > 0 ? 100 : 0,
    }));

    categoryComparison.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    return {
      month1: { month: m1, year: y1, income: inc1, expense: exp1, net: inc1 - exp1, categories: cats1 },
      month2: { month: m2, year: y2, income: inc2, expense: exp2, net: inc2 - exp2, categories: cats2 },
      diff: {
        incomeDiff: inc2 - inc1,
        expenseDiff: exp2 - exp1,
        netDiff: (inc2 - exp2) - (inc1 - exp1),
        incomePercent: inc1 > 0 ? Math.round(((inc2 - inc1) / inc1) * 100) : inc2 > 0 ? 100 : 0,
        expensePercent: exp1 > 0 ? Math.round(((exp2 - exp1) / exp1) * 100) : exp2 > 0 ? 100 : 0,
      },
      categoryComparison,
    };
  }

  async compareDays(userId: string, dateStr1: string, dateStr2: string) {
    const userObjId = new Types.ObjectId(userId);

    const d1 = new Date(dateStr1);
    const start1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 0, 0, 0);
    const end1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 23, 59, 59);

    const d2 = new Date(dateStr2);
    const start2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 0, 0, 0);
    const end2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 23, 59, 59);

    const [txs1, txs2] = await Promise.all([
      this.transactionModel.find({ userId: userObjId, date: { $gte: start1, $lte: end1 } }).populate('categoryId'),
      this.transactionModel.find({ userId: userObjId, date: { $gte: start2, $lte: end2 } }).populate('categoryId'),
    ]);

    const inc1 = txs1.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const exp1 = txs1.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

    const inc2 = txs2.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const exp2 = txs2.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

    const catMap = new Map<string, { name: string; color: string; icon: string; val1: number; val2: number }>();

    txs1.filter((t) => t.type === TransactionType.EXPENSE).forEach((t: any) => {
      const name = t.categoryId?.name || 'Khác';
      const color = t.categoryId?.color || '#6B7280';
      const icon = t.categoryId?.icon || 'Tag';
      if (!catMap.has(name)) {
        catMap.set(name, { name, color, icon, val1: 0, val2: 0 });
      }
      catMap.get(name)!.val1 += t.amount;
    });

    txs2.filter((t) => t.type === TransactionType.EXPENSE).forEach((t: any) => {
      const name = t.categoryId?.name || 'Khác';
      const color = t.categoryId?.color || '#6B7280';
      const icon = t.categoryId?.icon || 'Tag';
      if (!catMap.has(name)) {
        catMap.set(name, { name, color, icon, val1: 0, val2: 0 });
      }
      catMap.get(name)!.val2 += t.amount;
    });

    const categoryComparison = Array.from(catMap.values()).map((item) => ({
      ...item,
      diff: item.val2 - item.val1,
    }));

    categoryComparison.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    return {
      day1: { date: dateStr1, income: inc1, expense: exp1, net: inc1 - exp1, txCount: txs1.length },
      day2: { date: dateStr2, income: inc2, expense: exp2, net: inc2 - exp2, txCount: txs2.length },
      diff: {
        incomeDiff: inc2 - inc1,
        expenseDiff: exp2 - exp1,
        netDiff: (inc2 - exp2) - (inc1 - exp1),
      },
      categoryComparison,
    };
  }
}
