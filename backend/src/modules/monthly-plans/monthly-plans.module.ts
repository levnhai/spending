import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonthlyPlan, MonthlyPlanSchema } from '../../schemas/monthly-plan.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';
import { RecurringBill, RecurringBillSchema } from '../../schemas/recurring-bill.schema';
import { Debt, DebtSchema } from '../../schemas/debt.schema';
import { SavingsGoal, SavingsGoalSchema } from '../../schemas/savings-goal.schema';
import { MonthlyPlansController } from './monthly-plans.controller';
import { MonthlyPlansService } from './monthly-plans.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MonthlyPlan.name, schema: MonthlyPlanSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: RecurringBill.name, schema: RecurringBillSchema },
      { name: Debt.name, schema: DebtSchema },
      { name: SavingsGoal.name, schema: SavingsGoalSchema },
    ]),
  ],
  controllers: [MonthlyPlansController],
  providers: [MonthlyPlansService],
  exports: [MonthlyPlansService],
})
export class MonthlyPlansModule {}
