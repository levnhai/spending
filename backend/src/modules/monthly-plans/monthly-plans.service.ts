import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MonthlyPlan, MonthlyPlanDocument } from '../../schemas/monthly-plan.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import { RecurringBill, RecurringBillDocument } from '../../schemas/recurring-bill.schema';
import { Debt, DebtDocument, DebtStatus } from '../../schemas/debt.schema';
import { SavingsGoal, SavingsGoalDocument } from '../../schemas/savings-goal.schema';
import { SaveMonthlyPlanDto } from './dto/monthly-plan.dto';

@Injectable()
export class MonthlyPlansService {
  constructor(
    @InjectModel(MonthlyPlan.name) private planModel: Model<MonthlyPlanDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(RecurringBill.name) private billModel: Model<RecurringBillDocument>,
    @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
    @InjectModel(SavingsGoal.name) private savingsModel: Model<SavingsGoalDocument>,
  ) {}

  async getPlan(userId: string, month: number, year: number) {
    const userObjId = new Types.ObjectId(userId);
    let plan = await this.planModel
      .findOne({ userId: userObjId, month, year })
      .populate('categoryLimits.categoryId', 'name icon color type');

    // Dates for current month range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const totalDays = new Date(year, month, 0).getDate();

    // Calculate actual real-time transactions in this month
    const transactions = await this.transactionModel.find({
      userId: userObjId,
      date: { $gte: startDate, $lte: endDate },
    });

    const actualIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const actualExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    if (!plan) {
      return {
        hasPlan: false,
        month,
        year,
        actualIncome,
        actualExpense,
      };
    }

    const totalFixed = (plan.fixedExpenses || []).reduce((s, i) => s + i.amount, 0);
    const totalDebt = (plan.debtRepayments || []).reduce((s, i) => s + i.amount, 0);
    const totalSavings = (plan.savingsTargets || []).reduce((s, i) => s + i.amount, 0);
    const discretionaryBudget = Math.max(0, plan.expectedIncome - totalFixed - totalDebt - totalSavings);

    const dailyAllowance = Math.round(discretionaryBudget / totalDays);
    const weeklyAllowance = Math.round(discretionaryBudget / 4);

    // Calculate spending pace
    const now = new Date();
    let currentDay = now.getDate();
    if (now.getFullYear() !== year || now.getMonth() + 1 !== month) {
      currentDay = totalDays; // Past or future month
    }
    const daysPassedPercentage = Math.round((currentDay / totalDays) * 100);
    const spentPercentage = discretionaryBudget > 0 ? Math.round((actualExpense / discretionaryBudget) * 100) : 0;

    return {
      hasPlan: true,
      plan,
      month,
      year,
      totalDays,
      currentDay,
      summary: {
        expectedIncome: plan.expectedIncome,
        totalFixed,
        totalDebt,
        totalSavings,
        discretionaryBudget,
        dailyAllowance,
        weeklyAllowance,
        actualIncome,
        actualExpense,
        remainingDiscretionary: discretionaryBudget - actualExpense,
        daysPassedPercentage,
        spentPercentage,
        isOverPace: spentPercentage > daysPassedPercentage,
      },
    };
  }

  async savePlan(userId: string, dto: SaveMonthlyPlanDto) {
    const userObjId = new Types.ObjectId(userId);

    const fixedExpenses = (dto.fixedExpenses || []).map((f) => ({
      name: f.name,
      amount: f.amount,
      billId: f.billId ? new Types.ObjectId(f.billId) : undefined,
    }));

    const debtRepayments = (dto.debtRepayments || []).map((d) => ({
      name: d.name,
      amount: d.amount,
      debtId: d.debtId ? new Types.ObjectId(d.debtId) : undefined,
    }));

    const savingsTargets = (dto.savingsTargets || []).map((s) => ({
      name: s.name,
      amount: s.amount,
      goalId: s.goalId ? new Types.ObjectId(s.goalId) : undefined,
    }));

    const categoryLimits = (dto.categoryLimits || []).map((c) => ({
      categoryId: new Types.ObjectId(c.categoryId),
      amount: c.amount,
    }));

    const updatedPlan = await this.planModel.findOneAndUpdate(
      { userId: userObjId, month: dto.month, year: dto.year },
      {
        $set: {
          expectedIncome: dto.expectedIncome,
          fixedExpenses,
          debtRepayments,
          savingsTargets,
          categoryLimits,
          notes: dto.notes,
        },
      },
      { new: true, upsert: true },
    );

    return updatedPlan;
  }

  async getSuggestions(userId: string) {
    const userObjId = new Types.ObjectId(userId);

    const [bills, debts, savings] = await Promise.all([
      this.billModel.find({ userId: userObjId }),
      this.debtModel.find({ userId: userObjId, status: { $ne: DebtStatus.PAID } }),
      this.savingsModel.find({ userId: userObjId }),
    ]);

    return {
      suggestedBills: bills.map((b) => ({
        billId: b._id,
        name: b.title,
        amount: b.amount,
      })),
      suggestedDebts: debts.map((d) => ({
        debtId: d._id,
        name: `${d.type === 'BORROWED' ? 'Trả nợ' : 'Thu nợ'}: ${d.personName}`,
        amount: Math.max(0, d.amount - (d.paidAmount || 0)),
      })),
      suggestedSavings: savings.map((s) => ({
        goalId: s._id,
        name: `Tiết kiệm: ${s.title}`,
        amount: Math.max(0, s.targetAmount - (s.currentAmount || 0)),
      })),
    };
  }

  async removePlan(userId: string, month: number, year: number) {
    const result = await this.planModel.deleteOne({
      userId: new Types.ObjectId(userId),
      month,
      year,
    });
    if (result.deletedCount === 0) throw new NotFoundException('Không tìm thấy bản kế hoạch');
    return { message: 'Xóa kế hoạch thành công' };
  }
}
